(function v161FrontendSafetyFixes() {
  if (window.__v161FrontendSafetyFixes) return;
  window.__v161FrontendSafetyFixes = true;

  const EXTRA_ICONS = {
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12a9 9 0 0 1 15.5-6.2"/><path d="M18 3v5h-5"/><path d="M6 21v-5h5"/>',
    plane: '<path d="M10.5 13.5 3 21l2.5-7.5L2 10l3-2 5 2 7.5-7.5a2.1 2.1 0 0 1 3 3L13 13l2 5-2 3-3.5-3.5L2 20"/>',
  };

  const originalIconSvg = typeof window.iconSvg === "function"
    ? window.iconSvg
    : (typeof iconSvg === "function" ? iconSvg : null);

  function renderExtraIcon(name) {
    const body = EXTRA_ICONS[String(name || "")];
    if (!body) return "";
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }

  if (originalIconSvg && !originalIconSvg.__v161ExtraIcons) {
    const wrappedIconSvg = function wrappedIconSvg(name) {
      return renderExtraIcon(name) || originalIconSvg.apply(this, arguments);
    };
    wrappedIconSvg.__v161ExtraIcons = true;
    try { iconSvg = wrappedIconSvg; } catch (_) {}
    window.iconSvg = wrappedIconSvg;
  }

  function formatArabicDate(date, options) {
    try {
      return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", Object.assign({
        timeZone: "Asia/Riyadh",
      }, options)).format(date);
    } catch (_) {
      return "";
    }
  }

  function refreshStaticDates() {
    const now = new Date();
    const dashboardDate = document.querySelector(".dashboard-welcome-compact .eyebrow");
    if (dashboardDate) {
      const text = formatArabicDate(now, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (text) dashboardDate.textContent = text;
    }

    const payrollTitle = document.querySelector("#payrollView .payroll-hero span");
    if (payrollTitle) {
      const month = formatArabicDate(now, { month: "long", year: "numeric" });
      if (month) payrollTitle.textContent = "مسير رواتب " + month;
    }
  }

  function hydrateKnownIcons(root) {
    const scope = root || document;
    try {
      scope.querySelectorAll('[data-icon="refresh"], [data-icon="plane"]').forEach(function (element) {
        const name = element.getAttribute("data-icon") || "";
        const svg = renderExtraIcon(name);
        if (svg) {
          element.innerHTML = svg;
          element.dataset.hydratedIcon = name;
          element.dataset.v93Icon = name;
        }
      });
    } catch (_) {}
    try {
      if (typeof window.hydrateIcons === "function") window.hydrateIcons(scope);
    } catch (_) {}
    try {
      scope.querySelectorAll('[data-icon="refresh"], [data-icon="plane"]').forEach(function (element) {
        const name = element.getAttribute("data-icon") || "";
        const svg = renderExtraIcon(name);
        if (svg) element.innerHTML = svg;
      });
    } catch (_) {}
  }

  function scheduleRefresh(root) {
    refreshStaticDates();
    hydrateKnownIcons(root || document);
    setTimeout(function () {
      refreshStaticDates();
      hydrateKnownIcons(root || document);
    }, 120);
  }

  const originalRenderDashboard = typeof window.renderDashboard === "function"
    ? window.renderDashboard
    : (typeof renderDashboard === "function" ? renderDashboard : null);
  if (originalRenderDashboard && !originalRenderDashboard.__v161StaticDates) {
    const wrappedRenderDashboard = function wrappedRenderDashboard() {
      const result = originalRenderDashboard.apply(this, arguments);
      scheduleRefresh(document.querySelector("#dashboardView"));
      return result;
    };
    wrappedRenderDashboard.__v161StaticDates = true;
    try { renderDashboard = wrappedRenderDashboard; } catch (_) {}
    window.renderDashboard = wrappedRenderDashboard;
  }

  const originalRenderPayroll = typeof window.renderPayroll === "function"
    ? window.renderPayroll
    : (typeof renderPayroll === "function" ? renderPayroll : null);
  if (originalRenderPayroll && !originalRenderPayroll.__v161StaticDates) {
    const wrappedRenderPayroll = function wrappedRenderPayroll() {
      const result = originalRenderPayroll.apply(this, arguments);
      scheduleRefresh(document.querySelector("#payrollView"));
      return result;
    };
    wrappedRenderPayroll.__v161StaticDates = true;
    try { renderPayroll = wrappedRenderPayroll; } catch (_) {}
    window.renderPayroll = wrappedRenderPayroll;
  }

  document.addEventListener("DOMContentLoaded", function () {
    scheduleRefresh(document);
  });

  document.addEventListener("click", function (event) {
    const navTarget = event.target && event.target.closest && event.target.closest("[data-view], [data-go-view]");
    if (navTarget) setTimeout(function () { scheduleRefresh(document); }, 60);
  }, true);

  scheduleRefresh(document);
})();
