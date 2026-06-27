import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeRole = (role: unknown) => String(role || "employee").trim() === "admin" ? "admin" : "employee";
const normalizeBool = (value: unknown, fallback = true) => value === undefined ? fallback : value !== false && value !== "false";
const normalizePermissions = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const clean = (value: unknown) => String(value ?? "").trim();

async function findAuthUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  // listUsers is paginated. The project is small, but this remains safe enough for admin setup.
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data?.users?.find((user) => String(user.email || "").toLowerCase() === email);
    if (found) return found;
    if (!data?.users?.length || data.users.length < perPage) return null;
    page += 1;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Missing Supabase environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) return json({ error: "Unauthorized" }, 401);

    const caller = authData.user;
    const { data: callerProfile, error: profileError } = await adminClient
      .from("app_user_profiles")
      .select("id,user_id,role,is_active,email")
      .or(`user_id.eq.${caller.id},email.eq.${caller.email}`)
      .maybeSingle();

    if (profileError) return json({ error: profileError.message }, 500);
    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.is_active !== true) {
      return json({ error: "Only active admin users can manage accounts" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "create-user").trim();

    if (action === "list-users") {
      const { data, error } = await adminClient
        .from("app_user_profiles")
        .select("id,user_id,full_name,email,role,is_active,employee_id,permissions,created_at,updated_at")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, users: data || [] });
    }

    if (action === "update-user") {
      const id = clean(body.id);
      if (!id) return json({ error: "Missing user profile id" }, 400);
      if (id === callerProfile.id && normalizeBool(body.isActive ?? body.is_active, true) === false) {
        return json({ error: "Cannot disable current admin account" }, 400);
      }
      const email = clean(body.email).toLowerCase();
      const fullName = clean(body.fullName || body.full_name);
      if (!email || !email.includes("@")) return json({ error: "Invalid email" }, 400);
      if (!fullName) return json({ error: "Full name is required" }, 400);
      const employeeId = body.employeeId === undefined && body.employee_id === undefined ? null : clean(body.employeeId ?? body.employee_id) || null;
      const payload = {
        full_name: fullName,
        email,
        role: normalizeRole(body.role),
        is_active: normalizeBool(body.isActive ?? body.is_active, true),
        employee_id: employeeId,
        permissions: normalizePermissions(body.permissions),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await adminClient
        .from("app_user_profiles")
        .update(payload)
        .eq("id", id)
        .select("id,user_id,full_name,email,role,is_active,employee_id,permissions,created_at,updated_at")
        .single();
      if (error) return json({ error: error.message }, 500);
      if (data?.user_id) {
        const updatePayload: Record<string, unknown> = { email, user_metadata: { full_name: fullName } };
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(data.user_id, updatePayload);
        if (authUpdateError) console.warn("Auth update warning", authUpdateError.message);
        if (!payload.is_active) await adminClient.auth.admin.updateUserById(data.user_id, { ban_duration: "876000h" });
        if (payload.is_active) await adminClient.auth.admin.updateUserById(data.user_id, { ban_duration: "none" });
      }
      return json({ ok: true, user: data });
    }

    if (action === "toggle-user") {
      const id = clean(body.id);
      if (!id) return json({ error: "Missing user profile id" }, 400);
      const isActive = normalizeBool(body.isActive, true);
      if (id === callerProfile.id && !isActive) return json({ error: "Cannot disable current admin account" }, 400);
      const { data: profile, error: findError } = await adminClient.from("app_user_profiles").select("id,user_id,is_active").eq("id", id).single();
      if (findError) return json({ error: findError.message }, 500);
      const { data, error } = await adminClient.from("app_user_profiles").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id).select("id,user_id,full_name,email,role,is_active,employee_id,permissions,created_at,updated_at").single();
      if (error) return json({ error: error.message }, 500);
      if (profile?.user_id) await adminClient.auth.admin.updateUserById(profile.user_id, { ban_duration: isActive ? "none" : "876000h" });
      return json({ ok: true, user: data });
    }

    if (action === "delete-user") {
      const id = clean(body.id);
      if (!id) return json({ error: "Missing user profile id" }, 400);
      if (id === callerProfile.id) return json({ error: "Cannot delete current admin account" }, 400);
      const { data: profile, error: findError } = await adminClient.from("app_user_profiles").select("id,user_id,email").eq("id", id).single();
      if (findError) return json({ error: findError.message }, 500);
      if (profile?.user_id) {
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(profile.user_id);
        if (authDeleteError) console.warn("Auth delete warning", authDeleteError.message);
      }
      const { error } = await adminClient.from("app_user_profiles").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, deleted: true, id });
    }

    if (action !== "create-user" && action !== "create") return json({ error: "Unknown action" }, 400);

    const email = clean(body.email).toLowerCase();
    const password = String(body.password || "");
    const fullName = clean(body.fullName || body.full_name);
    const role = normalizeRole(body.role);
    const isActive = normalizeBool(body.isActive ?? body.is_active, true);
    const permissions = normalizePermissions(body.permissions);
    const employeeId = body.employeeId === undefined && body.employee_id === undefined ? null : clean(body.employeeId ?? body.employee_id) || null;

    if (!email || !email.includes("@")) return json({ error: "Invalid email" }, 400);
    if (!password || password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);
    if (!fullName) return json({ error: "Full name is required" }, 400);

    const existingAuthUser = await findAuthUserByEmail(adminClient, email);
    let authUser = existingAuthUser;
    if (!authUser) {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createError || !newUser?.user) return json({ error: createError?.message || "Unable to create user" }, 400);
      authUser = newUser.user;
    } else {
      await adminClient.auth.admin.updateUserById(authUser.id, { password, user_metadata: { full_name: fullName } });
    }
    if (authUser?.id) await adminClient.auth.admin.updateUserById(authUser.id, { ban_duration: isActive ? "none" : "876000h" });

    const { data, error: upsertError } = await adminClient
      .from("app_user_profiles")
      .upsert({
        user_id: authUser.id,
        full_name: fullName,
        email,
        role,
        is_active: isActive,
        employee_id: employeeId,
        permissions,
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" })
      .select("id,user_id,full_name,email,role,is_active,employee_id,permissions,created_at,updated_at")
      .single();

    if (upsertError) return json({ error: upsertError.message }, 500);
    return json({ ok: true, user_id: authUser.id, user: data, email, role, is_active: isActive });
  } catch (error) {
    console.error(error);
    return json({ error: error?.message || "Unexpected error" }, 500);
  }
});
