
/* =========================================================
   HARD FIX: menu visibility follows effective permissions
   - A sidebar item is shown when the user has the parent nav permission OR any child permission inside that section.
   - Establishment Documents is hidden unless one of documents.* permissions is enabled.
   - Re-applies after dynamic sidebar buttons are injected.
   ========================================================= */
(function hardFixMenuPermissionLogic(){
  const viewPermissionGroups = {
    dashboard: ['nav.dashboard', 'dashboard.stats', 'dashboard.attendanceOverview', 'dashboard.reviewRequests', 'dashboard.reviewActions', 'dashboard.establishmentExpiringDocs', 'dashboard.employeeExpiringDocs', 'dashboard.recentEmployees', 'dashboard.absenceShortcut', 'dashboard.reviewShortcut'],
    employees: ['nav.employees', 'employees.viewSelf', 'employees.viewAll', 'employees.create', 'employees.edit', 'employees.delete', 'employees.attachments'],
    attendance: ['nav.attendance', 'attendance.viewSelf', 'attendance.viewAll', 'attendance.markAbsent', 'attendance.deleteAbsence', 'attendance.export'],
    leaves: ['nav.leaves', 'leaves.viewOwn', 'leaves.viewAll', 'leaves.createLeave', 'leaves.createTravel', 'leaves.createForAll', 'leaves.approve', 'leaves.reject', 'leaves.resume', 'leaves.viewTravelers'],
    payroll: ['nav.payroll', 'payroll.viewSelf', 'payroll.viewAll', 'payroll.edit', 'payroll.commissions', 'payroll.printClearance'],
    establishmentDocuments: ['nav.establishmentDocuments', 'documents.view', 'documents.create', 'documents.edit', 'documents.delete', 'documents.upload'],
    departments: ['nav.departments', 'organization.view', 'organization.manage'],
    settings: ['nav.settings', 'settings.view', 'security.manage'],
    users: ['users.manage']
  };

  function isAdminUser(){
    return String(window.authProfile?.role || authProfile?.role || '').trim() === 'admin';
  }

  function hasPermission(key){
    if (isAdminUser()) return true;
    try {
      if (window.employeePermissionMatrix?.can) return Boolean(window.employeePermissionMatrix.can(key));
    } catch (_) {}
    const raw = (window.authProfile || authProfile || {})?.permissions || {};
    return Boolean(raw && raw[key]);
  }

  function viewHasEffectivePermission(view){
    if (isAdminUser()) return true;
    const keys = viewPermissionGroups[view] || [];
    return keys.some(hasPermission);
  }

  window.viewHasEffectivePermission = viewHasEffectivePermission;
  window.roleCanOpen = roleCanOpen = function(viewName){
    return viewHasEffectivePermission(viewName);
  };

  function applyHardVisibility(){
    document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
      const view = item.dataset.view;
      item.classList.toggle('is-permission-hidden', !viewHasEffectivePermission(view));
    });

    document.querySelectorAll('[data-go-view]').forEach((item) => {
      const view = item.dataset.goView;
      if (!view || !viewPermissionGroups[view]) return;
      item.classList.toggle('is-permission-hidden', !viewHasEffectivePermission(view));
    });

    // Section-level dashboard cards. These should not show unless their exact dashboard permission is enabled.
    document.querySelector('#statsGrid')?.classList.toggle('is-permission-hidden', !hasPermission('dashboard.stats'));
    document.querySelector('#dashboardEstDocsPanel')?.classList.toggle('is-permission-hidden', !(hasPermission('dashboard.establishmentExpiringDocs') && viewHasEffectivePermission('establishmentDocuments')));
    document.querySelector('#dashboardEmployeeDocsPanel')?.classList.toggle('is-permission-hidden', !hasPermission('dashboard.employeeExpiringDocs'));
    document.querySelector('.leave-panel')?.classList.toggle('is-permission-hidden', !hasPermission('dashboard.reviewRequests'));
    document.querySelector('.travelers-dashboard-panel')?.classList.toggle('is-permission-hidden', !hasPermission('dashboard.attendanceOverview') && !hasPermission('leaves.viewTravelers'));
    document.querySelector('.attendance-panel')?.classList.toggle('is-permission-hidden', !hasPermission('dashboard.attendanceOverview') && !hasPermission('leaves.viewTravelers') && !hasPermission('attendance.viewAll'));

    document.querySelectorAll('#newAbsenceBtn, #dashboardAbsenceBtn').forEach((btn) => {
      btn.classList.toggle('is-permission-hidden', !hasPermission('attendance.markAbsent'));
    });
    document.querySelectorAll('[data-go-view="leaves"].review-shortcut, #reviewRequestsBtn, [data-review-requests-shortcut]').forEach((btn) => {
      btn.classList.toggle('is-permission-hidden', !hasPermission('dashboard.reviewShortcut') && !hasPermission('dashboard.reviewRequests'));
    });
  }

  const previousApplyRolePermissions = window.applyRolePermissions || applyRolePermissions;
  window.applyRolePermissions = applyRolePermissions = function(){
    try { previousApplyRolePermissions?.(); } catch (_) {}
    applyHardVisibility();
  };

  const previousSwitchView = window.switchView || switchView;
  window.switchView = switchView = function(viewName){
    if (!viewHasEffectivePermission(viewName)) {
      try { showToast('ليست لديك صلاحية الدخول إلى هذا القسم'); } catch (_) {}
      return;
    }
    const result = previousSwitchView.apply(this, arguments);
    setTimeout(applyHardVisibility, 0);
    setTimeout(applyHardVisibility, 120);
    return result;
  };

  const observer = new MutationObserver(() => {
    clearTimeout(observer._timer);
    observer._timer = setTimeout(applyHardVisibility, 30);
  });
  const startObserver = () => {
    try { observer.observe(document.body, { childList: true, subtree: true }); } catch (_) {}
    applyHardVisibility();
    setTimeout(applyHardVisibility, 250);
    setTimeout(applyHardVisibility, 900);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver);
  else startObserver();
})();
