// ───── swapping CodeMirror themes ─────
const CM_LIGHT = 'elegant';
const CM_DARK  = 'dracula';
const API_BASE = window.location.origin;

function applyCMTheme() {
    const light = document.body.classList.contains('light-theme');
    const theme = light ? CM_LIGHT : CM_DARK;

    // Iterate over all named CodeMirror instances
    ['userCM', 'exampleCM', 'theoryCM1', 'theoryCM2', 'theoryCM3'].forEach(key => {
        if (window[key]) window[key].setOption('theme', theme);
    });
}

(function () {
    const root = document.body;
    const btn = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');

    if (!btn || !icon) return;  // fail fast if toggle elements are missing

    // 1. Apply saved preference (if any)
    if (localStorage.getItem('algolume-theme') === 'light') {
        root.classList.add('light-theme');
    }

    // 2. Update icon (moon ↔ sun)
    const setIcon = () => {
        icon.innerHTML = root.classList.contains('light-theme')
            ? '<path d="M21.752 14.002A9 9 0 0 1 9.998 2.248 7 7 0 1 0 21.752 14z"/>'  // moon icon
            : '<path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 0 1-2 0V5.5a1 1 0 0 1 1-1zm0 11a1 1 0 0 1 1 1V19a1 1 0 0 1-2 0v-2.5a1 1 0 0 1 1-1zm7.5-5.5a1 1 0 0 1 1 1h1.5a1 1 0 0 1 0 2H20.5a1 1 0 0 1-1-1 1 1 0 0 1 1-1zm-13 1a1 1 0 0 1 1-1H9a1 1 0 0 1 0 2H7.5a1 1 0 0 1-1-1zM17 7.06l1.06-1.06a1 1 0 0 1 1.41 1.42L18.41 8.48A1 1 0 1 1 17 7.06zM5.53 16.53a1 1 0 0 1 1.41 0l1.06 1.06a1 1 0 1 1-1.41 1.42L5.53 17.95a1 1 0 0 1 0-1.42zM17 16.94a1 1 0 0 1 1.41 1.42l-1.06 1.06a1 1 0 1 1-1.41-1.42l1.06-1.06zM5.53 7.47a1 1 0 0 1 1.41-1.42L8 7.11A1 1 0 1 1 6.59 8.53L5.53 7.47zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>';  // sun icon
    };
    setIcon();

    // 3. Toggle theme on click
    btn.addEventListener('click', () => {
        root.classList.toggle('light-theme');
        localStorage.setItem('algolume-theme',
            root.classList.contains('light-theme') ? 'light' : 'dark');
        setIcon();
        applyCMTheme();
    });

    // Apply theme to all CM instances on initial load
    applyCMTheme();
})();

// Ensure the example tab is visible and active on load.
exampleTab.classList.remove('hidden');
exampleTabBtn.classList.add('active-tab');
if (window.exampleCM) window.exampleCM.refresh();

/* Toggle the sidebar with one button that changes from ☰ to × */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content-container');
    const topBar = document.querySelector('.top-bar');
    const btn = document.querySelector('.menu-toggle');
    if (sidebar.classList.contains('closed')) {
        sidebar.classList.remove('closed');
        content.classList.add('shifted');
        topBar.classList.add('sidebar-open');
        btn.textContent = '×';
    } else {
        sidebar.classList.add('closed');
        content.classList.remove('shifted');
        topBar.classList.remove('sidebar-open');
        btn.textContent = '☰';
    }
}

/* Show/Hide Tab Content */
function showTab(tab) {
    const ex = document.getElementById('exampleTab');
    const us = document.getElementById('userTab');
    const exBtn = document.getElementById('exampleTabBtn');
    const usBtn = document.getElementById('userTabBtn');
    ex.classList.add('hidden');
    us.classList.add('hidden');
    exBtn.classList.remove('active-tab');
    usBtn.classList.remove('active-tab');
    if (tab === 'example') {
        ex.classList.remove('hidden');
        exBtn.classList.add('active-tab');
        if (window.exampleCM) window.exampleCM.refresh();
    } else {
        us.classList.remove('hidden');
        usBtn.classList.add('active-tab');
        if (window.userCM) window.userCM.refresh();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Initialize CodeMirror for the example code textarea
    const exampleTA = document.getElementById('example-code');
    if (exampleTA) {
        window.exampleCM = CodeMirror.fromTextArea(exampleTA, {
            lineNumbers: true,
            mode: "python",
            theme: document.body.classList.contains('light-theme') ? CM_LIGHT : CM_DARK,
            indentUnit: 4,
            autoCloseBrackets: true,
            readOnly: true
        });
    }

    // Initialize CodeMirror for the user code textarea
    const userTA = document.getElementById('user-code');
    if (userTA) {
        window.userCM = CodeMirror.fromTextArea(userTA, {
            lineNumbers: true,
            mode: "python",
            theme: document.body.classList.contains('light-theme') ? CM_LIGHT : CM_DARK,
            indentUnit: 4,
            autoCloseBrackets: true
        });
    }

    // Initialize CodeMirror for theory code snippets
    ['theory-code-snippet-1', 'theory-code-snippet-2', 'theory-code-snippet-3'].forEach((id, idx) => {
        const ta = document.getElementById(id);
        if (ta) {
            const cm = CodeMirror.fromTextArea(ta, {
                lineNumbers: true,
                mode: "python",
                theme: document.body.classList.contains('light-theme') ? CM_LIGHT : CM_DARK,
                indentUnit: 4,
                readOnly: true,
                viewportMargin: Infinity
            });
            window[`theoryCM${idx+1}`] = cm;
            cm.getWrapperElement().classList.add('theory-cm');
        }
    });

    // Setup custom alert modal
    const modal = document.getElementById("customAlertModal");
    const closeBtn = document.querySelector(".close-button");

    function CustomAlert(msg) {
        if (!modal) return;
        document.getElementById('alertMessage').textContent = msg;
        modal.style.display = "block";
    }

    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = e => {
        if (e.target === modal) modal.style.display = "none";
    };

    // Run example code
    const exampleRunBtn = document.getElementById('exampleRunBtn');
    if (exampleRunBtn && window.exampleCM) {
        exampleRunBtn.addEventListener('click', async e => {
            e.preventDefault();
            const code = window.exampleCM.getValue();
            const sVar = "s";
            const pVar = "p";

            if (code.split('\n').length > 300) {
                return CustomAlert('Code is too long! Max 300 lines.');
            }
            try {
                const res = await fetch(`${API_BASE}/new-debug-page-prefixfunction`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code, sVar, pVar})
                });
                if (!res.ok) throw new Error(`Status ${res.status}`);
                const result = await res.json();
                if (result.execution_time > 5 || result.memory_used > 256) {
                    CustomAlert(`Limit exceeded. Time: ${result.execution_time}s, Memory: ${result.memory_used}MB.`);
                } else if (result.error) {
                    CustomAlert("‼️ Error: " + result.error);
                } else {
                    window.location.href = result.url;
                }
            } catch (err) {
                console.error(err);
                CustomAlert('Error sending code to server.');
            }
        });
    }

    // Run user code
    const userRunBtn = document.getElementById('userRunBtn');
    if (userRunBtn && window.userCM) {
        userRunBtn.addEventListener('click', async e => {
            e.preventDefault();
            const code = window.userCM.getValue();
            const sVar = document.getElementById('var-s')?.value.trim();
            const pVar = document.getElementById('var-p')?.value.trim();
            if (!sVar || !pVar) {
                return CustomAlert("Please fill in all fields in the table.");
            }
            if (!code.includes(sVar)) {
                return CustomAlert(`Variable "${sVar}" not found in your code.`);
            }
            if (!code.includes(pVar)) {
                return CustomAlert(`Variable "${pVar}" not found in your code.`);
            }
            if (code.split('\n').length > 300) {
                return CustomAlert('Code is too long! Max 300 lines.');
            }
            try {
                const res = await fetch(`${API_BASE}/new-debug-page-prefixfunction`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code, sVar, pVar})
                });
                if (!res.ok) throw new Error(`Status ${res.status}`);
                const result = await res.json();
                if (result.execution_time > 5 || result.memory_used > 256) {
                    CustomAlert(`Limit exceeded. Time: ${result.execution_time}s, Memory: ${result.memory_used}MB.`);
                } else if (result.error) {
                    CustomAlert("‼️ Error: " + result.error);
                } else {
                    window.location.href = result.url;
                }
            } catch (err) {
                console.error(err);
                CustomAlert('Error sending code to server.');
            }
        });
    }

    // Refresh CodeMirror after sidebar transition
    const container = document.getElementById('content-container');
    if (container) {
        container.addEventListener('transitionend', e => {
            if (e.propertyName === 'transform') {
                if (window.exampleCM) window.exampleCM.refresh();
                if (window.userCM) window.userCM.refresh();
            }
        });
    }
});

(function () {
    applyCMTheme();
    document.getElementById('themeToggle').addEventListener('click', applyCMTheme);
})();

(function () {
    const SUN = `
<g fill="currentColor">
  <circle cx="12" cy="12" r="5"/>
  <g>
    <rect x="11" y="0" width="2" height="4" rx="1"/>
    <rect x="11" y="20" width="2" height="4" rx="1"/>
    <rect x="0" y="11" width="4" height="2" rx="1"/>
    <rect x="20" y="11" width="4" height="2" rx="1"/>
    <rect x="3.5" y="3.5" width="2" height="4" rx="1" transform="rotate(-45 4.5 5.5)"/>
    <rect x="18.5" y="16.5" width="2" height="4" rx="1" transform="rotate(-45 19.5 18.5)"/>
    <rect x="3.5" y="16.5" width="2" height="4" rx="1" transform="rotate(45 4.5 18.5)"/>
    <rect x="18.5" y="3.5" width="2" height="4" rx="1" transform="rotate(45 19.5 5.5)"/>
  </g>
</g>`;

    const MOON_TRANSLATE_Y = 3;
    const MOON = `
<g fill="currentColor" transform="translate(0, ${MOON_TRANSLATE_Y})">
  <path d="M22 12.79A10 10 0 0 1 11.21 2 8 8 0 1 0 22 12.79z"/>
</g>`;

    const btn = document.getElementById('themeToggle');
    const ico = document.getElementById('themeIcon');

    const redraw = () => {
        ico.setAttribute('viewBox', '0 0 24 24');
        ico.innerHTML = document.body.classList.contains('light-theme') ? MOON : SUN;
    };

    redraw();
    btn.addEventListener('click', redraw);
})();
