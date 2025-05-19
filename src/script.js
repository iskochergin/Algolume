/* Toggle the sidebar with ONE button that changes from ☰ to × */
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
            viewportMargin: Infinity
        }
    );
    window.userCM = cm; // чтобы refresher в showTab не упал

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


/* ───  Хелперы  ───────────────────────────────────────────── */
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
            const res = await fetch(`https://algolume.ru${endpoint}`, {
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
