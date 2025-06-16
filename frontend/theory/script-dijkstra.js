// ───── swapping codemirror themes ─────
const CM_LIGHT = 'elegant';
const CM_DARK  = 'dracula';

function applyCMTheme() {
    const light = document.body.classList.contains('light-theme');
    const theme = light ? CM_LIGHT : CM_DARK;

    // Перебрать все именованные экземпляры CM
    ['userCM', 'exampleCM', 'theoryCM1', 'theoryCM2', 'theoryCM3', 'theoryCM4']
      .forEach(key => {
        if (window[key]) window[key].setOption('theme', theme);
      });
}

(function () {
    const root = document.body;
    const btn = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');

    if (!btn || !icon) return;  // fail fast

    // 1.  Apply saved preference (if any)
    if (localStorage.getItem('algolume-theme') === 'light') {
        root.classList.add('light-theme');
    }

    // 2.  Update icon (sun ↔ moon)
    const setIcon = () => {
        icon.innerHTML = root.classList.contains('light-theme')
            ? '<path d="M21.752 14.002A9 9 0 0 1 9.998 2.248 7 7 0 1 0 21.752 14z"/>'
            : '<path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 0 1-2 0V5.5a1 1 0 0 1 1-1zm0 11a1 1 0 0 1 1 1V19a1 1 0 0 1-2 0v-2.5a1 1 0 0 1 1-1zm7.5-5.5a1 1 0 0 1 1 1h1.5a1 1 0 0 1 0 2H20.5a1 1 0 0 1-1-1 1 1 0 0 1 1-1zm-13 1a1 1 0 0 1 1-1H9a1 1 0 0 1 0 2H7.5a1 1 0 0 1-1-1zM17 7.06l1.06-1.06a1 1 0 0 1 1.41 1.42L18.41 8.48A1 1 0 1 1 17 7.06zM5.53 16.53a1 1 0 0 1 1.41 0l1.06 1.06a1 1 0 1 1-1.41 1.42L5.53 17.95a1 1 0 0 1 0-1.42zM17 16.94a1 1 0 0 1 1.41 1.42l-1.06 1.06a1 1 0 1 1-1.41-1.42l1.06-1.06zM5.53 7.47a1 1 0 0 1 1.41-1.42L8 7.11A1 1 0 1 1 6.59 8.53L5.53 7.47zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>';
    };
    setIcon();

    // 3.  Toggle on click
    btn.addEventListener('click', () => {
        root.classList.toggle('light-theme');
        localStorage.setItem('algolume-theme',
            root.classList.contains('light-theme') ? 'light' : 'dark');
        setIcon();
        applyCMTheme();
    });
})();

// Ensure the example tab is visible and active on load.
exampleTab.classList.remove('hidden');
exampleTabBtn.classList.add('active-tab');
if (window.exampleCM) window.exampleCM.refresh();

/* Toggle the sidebar with one button that changes from ☰ to × */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const contentContainer = document.getElementById('content-container');
    const topBar = document.querySelector('.top-bar');
    const menuToggleBtn = document.querySelector('.menu-toggle');

    if (sidebar.classList.contains('closed')) {
        sidebar.classList.remove('closed');
        contentContainer.classList.add('shifted');
        topBar.classList.add('sidebar-open');
        menuToggleBtn.textContent = '×';
    } else {
        sidebar.classList.add('closed');
        contentContainer.classList.remove('shifted');
        topBar.classList.remove('sidebar-open');
        menuToggleBtn.textContent = '☰';
    }
}

/* Show/Hide Tab Content */
function showTab(tabName) {
    const exampleTab = document.getElementById('exampleTab');
    const userTab = document.getElementById('userTab');
    const exampleTabBtn = document.getElementById('exampleTabBtn');
    const userTabBtn = document.getElementById('userTabBtn');

    exampleTab.classList.add('hidden');
    userTab.classList.add('hidden');

    exampleTabBtn.classList.remove('active-tab');
    userTabBtn.classList.remove('active-tab');

    if (tabName === 'example') {
        exampleTab.classList.remove('hidden');
        exampleTabBtn.classList.add('active-tab');
        if (window.exampleCM) window.exampleCM.refresh();
    } else {
        userTab.classList.remove('hidden');
        userTabBtn.classList.add('active-tab');
        if (window.userCM) window.userCM.refresh();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Initialize CodeMirror for the example code textarea.
    const exampleCodeTextarea = document.getElementById('example-code');
    if (exampleCodeTextarea) {
        window.exampleCM = CodeMirror.fromTextArea(exampleCodeTextarea, {
            lineNumbers: true,
            mode: "python",
            theme: document.body.classList.contains('light-theme') ? CM_LIGHT : CM_DARK,
            indentUnit: 4,
            autoCloseBrackets: true,
            readOnly: true
        });
    }

    // Initialize CodeMirror for the user code textarea.
    const userCodeTextarea = document.getElementById('user-code');
    if (userCodeTextarea) {
        window.userCM = CodeMirror.fromTextArea(userCodeTextarea, {
            lineNumbers: true,
            mode: "python",
            theme: document.body.classList.contains('light-theme') ? CM_LIGHT : CM_DARK,
            indentUnit: 4,
            autoCloseBrackets: true
        });
    }

    // Initialize CodeMirror for theory code snippets.
    const snippet1 = document.getElementById('theory-code-snippet-1');
    if (snippet1) {
        window.theoryCM1 = CodeMirror.fromTextArea(snippet1, {
            lineNumbers: true,
            mode: "python",
            theme: document.body.classList.contains('light-theme') ? CM_LIGHT : CM_DARK,
            indentUnit: 4,
            readOnly: true,
            viewportMargin: Infinity
        });
        window.theoryCM1.getWrapperElement().classList.add('theory-cm');
    }

    const snippet2 = document.getElementById('theory-code-snippet-2');
    if (snippet2) {
        window.theoryCM2 = CodeMirror.fromTextArea(snippet2, {
            lineNumbers: true,
            mode: "python",
            theme: document.body.classList.contains('light-theme') ? CM_LIGHT : CM_DARK,
            indentUnit: 4,
            readOnly: true,
            viewportMargin: Infinity
        });
        window.theoryCM2.getWrapperElement().classList.add('theory-cm');
    }

    // (If you have more snippets, repeat similarly for snippet3, snippet4, etc.)

    // Setup modal for alerts.
    const modal = document.getElementById("customAlertModal");
    const closeBtn = document.getElementsByClassName("close-button")[0];

    function CustomAlert(message) {
        if (!modal) return;
        document.getElementById('alertMessage').textContent = message;
        modal.style.display = "block";
    }

    if (closeBtn) {
        closeBtn.onclick = function () {
            modal.style.display = "none";
        };
    }
    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    // Set up the run button for the example tab.
    const exampleRunBtn = document.getElementById('exampleRunBtn');
    if (exampleRunBtn && window.exampleCM) {
        exampleRunBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            const code = window.exampleCM.getValue();
            const maxCodeLines = 300;
            const codeLines = code.split('\n').length;
            if (codeLines > maxCodeLines) {
                CustomAlert('Слишком много строк кода! Максимальное количество – 300.');
                return;
            }
            try {
                // For Dijkstra, we expect variables: parent, graph, dist.
                const parentVar = 'parent';
                const graphVar = 'graph';
                const distVar = 'dist';
                const response = await fetch('http://127.0.0.1:5000/new-debug-page-dijkstra', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code, parentVar, graphVar, distVar})
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                const debugging_result = await response.json();
                if (debugging_result.execution_time > 5 || debugging_result.memory_used > 256) {
                    CustomAlert(`Превышены лимиты: Время – ${debugging_result.execution_time} сек., Память – ${debugging_result.memory_used} МБ.`);
                } else if (debugging_result.error) {
                    CustomAlert("‼️ Ошибка: " + debugging_result.error);
                } else {
                    window.location.href = debugging_result.url;
                }
            } catch (error) {
                console.error('Fetch error:', error);
                CustomAlert('Ошибка при отправке кода на сервер.');
            }
        });
    }

    // Set up the run button for the user tab.
    const userRunBtn = document.getElementById('userRunBtn');
    if (userRunBtn && window.userCM) {
        userRunBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            const code = window.userCM.getValue();
            const parentVarInput = document.getElementById('var-parent')?.value.trim();
            const graphVarInput = document.getElementById('var-graph')?.value.trim();
            const distVarInput = document.getElementById('var-dist')?.value.trim();
            if (!parentVarInput || !graphVarInput || !distVarInput) {
                CustomAlert("Пожалуйста, заполните все переменные в таблице.");
                return;
            }
            if (!code.includes(parentVarInput)) {
                CustomAlert(`Переменная "${parentVarInput}" не найдена в вашем коде.`);
                return;
            }
            if (!code.includes(graphVarInput)) {
                CustomAlert(`Переменная "${graphVarInput}" не найдена в вашем коде.`);
                return;
            }
            if (!code.includes(distVarInput)) {
                CustomAlert(`Переменная "${distVarInput}" не найдена в вашем коде.`);
                return;
            }
            const maxCodeLines = 300;
            const codeLines = code.split('\n').length;
            if (codeLines > maxCodeLines) {
                CustomAlert('Слишком много строк кода! Максимальное количество – 300.');
                return;
            }
            try {
                const response = await fetch('http://127.0.0.1:5000/new-debug-page-dijkstra', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        code,
                        parentVar: parentVarInput,
                        graphVar: graphVarInput,
                        distVar: distVarInput
                    })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                const debugging_result = await response.json();
                if (debugging_result.execution_time > 5 || debugging_result.memory_used > 256) {
                    CustomAlert(`Превышены лимиты: Время – ${debugging_result.execution_time} сек., Память – ${debugging_result.memory_used} МБ.`);
                } else if (debugging_result.error) {
                    CustomAlert("‼️ Ошибка: " + debugging_result.error);
                } else {
                    window.location.href = debugging_result.url;
                }
            } catch (error) {
                console.error('Fetch error:', error);
                CustomAlert('Ошибка при отправке кода на сервер.');
            }
        });
    }

    // Refresh CodeMirror when content container transition ends.
    const contentContainer = document.getElementById('content-container');
    if (contentContainer) {
        contentContainer.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'transform') {
                if (window.exampleCM) window.exampleCM.refresh();
                if (window.userCM)    window.userCM.refresh();
            }
        });
    }

    // Apply the current theme to all CM instances on initial load
    applyCMTheme();
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
