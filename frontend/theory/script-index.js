// swapping codemirror themes
const CM_LIGHT = 'elegant';
const CM_DARK = 'dracula';

const applyCMTheme = () => {
    const light = document.body.classList.contains('light-theme');
    const theme = light ? CM_LIGHT : CM_DARK;

    ['userCM', 'exampleCM'].forEach(key => {
        if (window[key]) window[key].setOption('theme', theme);
    });

    const moon = document.querySelector('#themeIcon .moon');
    if (moon) {
        moon.setAttribute('vector-effect', 'non-scaling-stroke');
    }
};

/* ─────────── Theme toggle ─────────── */
(function () {
    const root = document.body;
    const btn = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');

    if (!btn || !icon) return;                        // fail fast

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
    });
})();

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

function CustomAlert(message) {
    const modal = document.getElementById('customAlertModal');
    const msgEl = document.getElementById('alertMessage');
    if (!modal || !msgEl) return;
    msgEl.textContent = message;
    modal.style.display = 'block';
}

const modal = document.getElementById('customAlertModal');
const closeBtn = modal?.querySelector('.close-button');
closeBtn?.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    // инициализируем CodeMirror над textarea
    const cm = CodeMirror.fromTextArea(
        document.getElementById('code-input'),
        {
            mode: 'python',
            theme: 'dracula',
            lineNumbers: true,
            indentUnit: 4,
            tabSize: 4,
            viewportMargin: Infinity,
            autoCloseBrackets: true,
        }
    );
    window.userCM = cm; // чтобы refresher в showTab не упал

    applyCMTheme();


    // кнопка «Предсказать»
    document.getElementById('predict-btn')
        .addEventListener('click', async (e) => {
            const code = cm.getValue();
            if (!code.trim()) {
                CustomAlert('Вставьте код');
                return;
            }

            const btn = e.currentTarget;
            const spinner = btn.querySelector('.loader');
            btn.disabled = true;
            spinner.classList.remove('hidden');

            try {
                const res = await fetch('/api/predict', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code})
                });
                if (!res.ok) throw new Error('Ошибка сервера');
                const data = await res.json();
                showPrediction(data.predictions);
            } catch (err) {
                CustomAlert(err.message || 'Сбой сети');
            } finally {
                spinner.classList.add('hidden');
                btn.disabled = false;
            }
        });
});

const algoTemplates = {
    Dijkstra: {
        html: `
      <table class="variables-table">
        <thead>
          <tr>
            <th>Логическое название</th>
            <th>Название переменной</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="tooltip" data-tooltip="Список смежности графа">graph</td>
            <td><input type="text" id="var-graph" placeholder="например, graph"></td>
          </tr>
          <tr>
            <td class="tooltip" data-tooltip="Массив предков для восстановления пути">parent</td>
            <td><input type="text" id="var-parent" placeholder="например, parent"></td>
          </tr>
          <tr>
            <td class="tooltip" data-tooltip="Массив кратчайших расстояний от старта">dist</td>
            <td><input type="text" id="var-dist" placeholder="например, dist"></td>
          </tr>
        </tbody>
      </table>
      <div class="run-button-area">
        <button id="userRunBtn" class="run-btn">Запустить</button>
      </div>
    `,
        validate: (code) => {
            const g = val('var-graph'), p = val('var-parent'), d = val('var-dist');
            return checkFilled(g, p, d) && checkExists(code, g, p, d) && {graphVar: g, parentVar: p, distVar: d};
        },
        endpoint: '/new-debug-page-dijkstra'
    },

    DFS: {
        html: `
      <table class="variables-table">
        <thead>
          <tr>
            <th>Логическое название</th>
            <th>Название переменной</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="tooltip" data-tooltip="Список смежности графа">graph</td>
            <td><input type="text" id="var-graph" placeholder="например, graph"></td>
          </tr>
          <tr>
            <td class="tooltip" data-tooltip="Массив предков для восстановления пути">parent</td>
            <td><input type="text" id="var-parent" placeholder="например, parent"></td>
          </tr>
        </tbody>
      </table>
      <div class="run-button-area">
        <button id="userRunBtn" class="run-btn">Запустить</button>
      </div>
    `,
        validate: (code) => {
            const g = val('var-graph'), p = val('var-parent');
            return checkFilled(g, p) && checkExists(code, g, p) && {graphVar: g, parentVar: p};
        },
        endpoint: '/new-debug-page-dfs'
    },

    BFS: {
        html: `
      <table class="variables-table">
        <thead>
          <tr>
            <th>Логическое название</th>
            <th>Название переменной</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Список смежности графа</td>
            <td><input type="text" id="var-graph" placeholder="например, graph"></td>
          </tr>
          <tr>
            <td>Массив предков</td>
            <td><input type="text" id="var-parent" placeholder="например, parent"></td>
          </tr>
        </tbody>
      </table>
      <div class="run-button-area">
        <button id="userRunBtn" class="run-btn">Запустить</button>
      </div>
    `,
        validate: (code) => {
            const g = val('var-graph'), p = val('var-parent');
            return checkFilled(g, p) && checkExists(code, g, p) && {graphVar: g, parentVar: p};
        },
        endpoint: '/new-debug-page-bfs'
    },

    Turtle: {
        html: `
      <table class="variables-table">
        <thead>
          <tr>
            <th>Логическое название</th>
            <th>Название переменной</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="tooltip" data-tooltip="Таблица динамики (минимальная стоимость)">dp</td>
            <td><input type="text" id="var-dp" placeholder="например, dp"></td>
          </tr>
          <tr>
            <td class="tooltip" data-tooltip="Массив предков для восстановления пути">parent</td>
            <td><input type="text" id="var-parent" placeholder="например, parent"></td>
          </tr>
        </tbody>
      </table>
      <div class="run-button-area">
        <button id="userRunBtn" class="run-btn">Запустить</button>
      </div>
    `,
        validate: (code) => {
            const d = val('var-dp'), p = val('var-parent');
            return checkFilled(d, p) && checkExists(code, d, p) && {dpVar: d, parentVar: p};
        },
        endpoint: '/new-debug-page-turtle'
    },

    Grasshopper: {
        html: `
      <table class="variables-table">
        <thead>
          <tr>
            <th>Логическое название</th>
            <th>Название переменной</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="tooltip" data-tooltip="Таблица динамики (число способов или стоимости)">dp</td>
            <td><input type="text" id="var-dp" placeholder="например, dp"></td>
          </tr>
          <tr>
            <td class="tooltip" data-tooltip="Массив предков для восстановления пути">parent</td>
            <td><input type="text" id="var-parent" placeholder="например, parent"></td>
          </tr>
        </tbody>
      </table>
      <div class="run-button-area">
        <button id="userRunBtn" class="run-btn">Запустить</button>
      </div>
    `,
        validate: (code) => {
            const d = val('var-dp'), p = val('var-parent');
            return checkFilled(d, p) && checkExists(code, d, p) && {dpVar: d, parentVar: p};
        },
        endpoint: '/new-debug-page-grasshopper'
    }
};


const val = id => document.getElementById(id)?.value.trim();
const checkFilled = (...vars) => vars.every(v => v) || (CustomAlert("Заполните все поля!"), false);
const checkExists = (code, ...vars) =>
    vars.every(v => code.includes(v)) || (CustomAlert("Не найдены указанные переменные в коде"), false);

function mountAlgoConfig(algoName) {
    const key = Object.keys(algoTemplates)
        .find(k => algoName.toLowerCase().includes(k.toLowerCase()));
    if (!key) return;
    const {html, validate, endpoint} = algoTemplates[key];

    const host = document.getElementById('algo-config');
    host.innerHTML = html;

    document.getElementById('userRunBtn').onclick = async (e) => {
        e.preventDefault();
        const code = window.userCM.getValue();
        const extra = validate(code);
        if (!extra) return;

        const lines = code.split('\n').length;
        if (lines > 300) {
            CustomAlert('Слишком много строк кода (макс 300)');
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:5000/${endpoint}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({code, ...extra})
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || res.status);
            }
            const dbg = await res.json();
            if (dbg.execution_time > 5 || dbg.memory_used > 256) {
                CustomAlert(`Превышены лимиты: ${dbg.execution_time}s / ${dbg.memory_used}MB`);
            } else if (dbg.error) {
                CustomAlert("‼️ Ошибка: " + dbg.error);
            } else {
                window.location.href = dbg.url;
            }
        } catch (err) {
            console.error(err);
            CustomAlert('Ошибка при обращении к серверу');
        }
    };
}

let lastPreds = [];
let currentPred = '';

function showPrediction(list) {
    lastPreds = list;
    const [best] = list;
    currentPred = best[0];

    const area = document.getElementById('prediction-area');
    const select = document.getElementById('correction-select');
    const probNode = document.getElementById('prediction-prob');
    const topCard = document.querySelector('#neuro > .glass-card');

    probNode.textContent = `— ${(best[1] * 100).toFixed(1)} %`;

    select.innerHTML = '';
    list.forEach(([cls]) => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls;
        select.appendChild(opt);
    });

    mountAlgoConfig(currentPred);

    select.onchange = async (e) => {
        const chosen = e.target.value;
        const code = window.userCM.getValue();

        fetch('/api/log', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                code,
                predicted: currentPred,
                correct: chosen
            })
        }).catch(() => {
        });

        const entry = lastPreds.find(([cls]) => cls === chosen);
        const p = entry ? (entry[1] * 100).toFixed(1) : '0.0';
        probNode.textContent = `— ${p} %`;

        mountAlgoConfig(chosen);
    };

    area.classList.remove('hidden');
    topCard.classList.add('prediction-open');
    requestAnimationFrame(() => area.classList.add('show'));
}


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
