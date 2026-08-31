(function () {
    function getAdminUser() {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) return null;
            const user = JSON.parse(raw);
            return user && user.role === 'admin' ? user : null;
        } catch (_) {
            return null;
        }
    }

    function adminHref() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const depth = Math.max(0, parts.length - 1);
        return '../'.repeat(depth) + 'admin.html';
    }

    function ensureAdminControls() {
        const user = getAdminUser();
        if (!user || !localStorage.getItem('token')) return;
        const host = document.getElementById('auth-container');
        if (!host || host.querySelector('[data-sfp-admin-controls]')) return;

        const controls = document.createElement('div');
        controls.setAttribute('data-sfp-admin-controls', 'true');
        controls.style.cssText = 'display:flex;align-items:center;gap:7px;margin-right:8px;flex-wrap:wrap;justify-content:flex-end;';
        controls.innerHTML = `
            <span style="background:#dc2626;color:#fff;border-radius:999px;padding:4px 8px;font-size:8px;font-weight:900;letter-spacing:.08em;font-style:italic;">ADMIN</span>
            <a href="${adminHref()}" style="background:#000;color:#fff;border-radius:9px;padding:7px 10px;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;font-style:italic;text-decoration:none;white-space:nowrap;">⚙ ADMIN PANEL</a>
        `;
        host.prepend(controls);
    }

    function boot() {
        ensureAdminControls();
        const host = document.getElementById('auth-container');
        if (host) {
            new MutationObserver(() => ensureAdminControls()).observe(host, { childList: true, subtree: false });
        }
        setTimeout(ensureAdminControls, 0);
        setTimeout(ensureAdminControls, 250);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
