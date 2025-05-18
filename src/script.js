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


    // отправка исправления
    document.getElementById('correction-btn')
        .addEventListener('click', async () => {
            const correct = document.getElementById('correction-select').value;
            const code = cm.getValue();
            await fetch('/api/log', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({correct, code})
            });
            CustomAlert('Спасибо, поправили!');
        });
});

function showPrediction(list) {
    const [best] = list;
    const area = document.getElementById('prediction-area');
    const listDiv = document.getElementById('prediction-list');
    const select = document.getElementById('correction-select');
    const topCard = document.querySelector('#neuro > .glass-card'); // первая карта

    /* текст + селект как раньше */
    listDiv.innerHTML = `
    <p style="font-size:1.1rem;margin:6px 0;">
      <strong>${best[0]}</strong> — ${(best[1] * 100).toFixed(1)}%
    </p>`;
    select.innerHTML = '';
    list.forEach(([cls]) => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls;
        select.appendChild(opt);
    });

    /* показываем */
    area.classList.remove('hidden');
    topCard.classList.add('prediction-open');        // <= НОВОЕ
    requestAnimationFrame(() => area.classList.add('show'));
}


