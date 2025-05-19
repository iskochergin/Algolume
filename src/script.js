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
            mode: 'python',          // можно переключать динамически
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

/* ↓ убираем старый обработчик кнопки
document.getElementById('correction-btn')
...
*/

/* Храним последние предсказания глобально */
let lastPreds = [];

/* showPrediction теперь: */
function showPrediction(list) {
    lastPreds = list;                        // запоминаем топ-k
    const [best] = list;

    const area = document.getElementById('prediction-area');
    const select = document.getElementById('correction-select');
    const textNode = document.getElementById('prediction-text');
    const topCard = document.querySelector('#neuro > .glass-card');

    /* выводим из best */
    textNode.innerHTML =
        `<strong>${best[0]}</strong> — ${(best[1] * 100).toFixed(1)} %`;

    /* собираем <option> */
    select.innerHTML = '';
    list.forEach(([cls]) => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls;
        select.appendChild(opt);
    });

    /* авто-сохранение при смене */
    select.onchange = async (e) => {
        const chosen = e.target.value;

        /* логируем выбор */
        const code = window.userCM.getValue();
        fetch('/api/log', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({correct: chosen, code})
        }).catch(() => {
        });   // тихо, ошибок не показываем

        /* ищем вероятность в lastPreds,
           если её нет – ставим 0 % (редкий случай) */
        const entry = lastPreds.find(([cls]) => cls === chosen);
        const p = entry ? (entry[1] * 100).toFixed(1) : '0.0';

        textNode.innerHTML = `<strong>${chosen}</strong> — ${p} %`;
    };

    /* показываем блок */
    area.classList.remove('hidden');
    topCard.classList.add('prediction-open');
    requestAnimationFrame(() => area.classList.add('show'));
}


