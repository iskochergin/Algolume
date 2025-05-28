exampleTab.classList.remove('hidden');
exampleTabBtn.classList.add('active-tab');
if (window.exampleCM) window.exampleCM.refresh();

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

/* Показываем вкладки */
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
    // Инициализация CodeMirror
    const exampleTA = document.getElementById('example-code');
    if (exampleTA) {
        window.exampleCM = CodeMirror.fromTextArea(exampleTA, {
            lineNumbers: true, mode: "python", theme: "dracula",
            indentUnit: 4, autoCloseBrackets: true, readOnly: true
        });
    }
    const userTA = document.getElementById('user-code');
    if (userTA) {
        window.userCM = CodeMirror.fromTextArea(userTA, {
            lineNumbers: true, mode: "python", theme: "dracula",
            indentUnit: 4, autoCloseBrackets: true
        });
    }
    // Скрытые сниппеты
    ['theory-code-snippet-1', 'theory-code-snippet-2', 'theory-code-snippet-3'].forEach(id => {
        const ta = document.getElementById(id);
        if (ta) {
            const cm = CodeMirror.fromTextArea(ta, {
                lineNumbers: true, mode: "python", theme: "dracula",
                indentUnit: 4, readOnly: true, viewportMargin: Infinity
            });
            cm.getWrapperElement().classList.add('theory-cm');
        }
    });

    // Модалка для ошибок
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

    // Запуск примера
    const exampleRunBtn = document.getElementById('exampleRunBtn');
    if (exampleRunBtn && window.exampleCM) {
        exampleRunBtn.addEventListener('click', async e => {
            e.preventDefault();
            const code = window.exampleCM.getValue();
            if (code.split('\n').length > 300) {
                return CustomAlert('Код слишком длинный! Не более 300 строк.');
            }
            try {
                const res = await fetch('http://127.0.0.1:5000/new-debug-page-zfunction', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code})
                });
                if (!res.ok) throw new Error(`Статус ${res.status}`);
                const result = await res.json();
                if (result.execution_time > 5 || result.memory_used > 256) {
                    CustomAlert(`Превышен лимит. Время: ${result.execution_time}s, Память: ${result.memory_used}MB.`);
                } else if (result.error) {
                    CustomAlert("‼️ Error: " + result.error);
                } else {
                    window.location.href = result.url;
                }
            } catch (err) {
                console.error(err);
                CustomAlert('Ошибка при отправке кода на сервер.');
            }
        });
    }

    // Запуск пользовательского кода
    const userRunBtn = document.getElementById('userRunBtn');
    if (userRunBtn && window.userCM) {
        userRunBtn.addEventListener('click', async e => {
            e.preventDefault();
            const code = window.userCM.getValue();
            const sVar = document.getElementById('var-s')?.value.trim();
            const zVar = document.getElementById('var-z')?.value.trim();
            if (!sVar || !zVar) {
                return CustomAlert("Пожалуйста, заполните все поля в таблице.");
            }
            if (!code.includes(sVar)) {
                return CustomAlert(`Переменная "${sVar}" не найдена в вашем коде.`);
            }
            if (!code.includes(zVar)) {
                return CustomAlert(`Переменная "${zVar}" не найдена в вашем коде.`);
            }
            if (code.split('\n').length > 300) {
                return CustomAlert('Код слишком длинный! Не более 300 строк.');
            }
            try {
                const res = await fetch('http://127.0.0.1:5000/new-debug-page-zfunction', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code, sVar, zVar})
                });
                if (!res.ok) throw new Error(`Статус ${res.status}`);
                const result = await res.json();
                if (result.execution_time > 5 || result.memory_used > 256) {
                    CustomAlert(`Превышен лимит. Время: ${result.execution_time}s, Память: ${result.memory_used}MB.`);
                } else if (result.error) {
                    CustomAlert("‼️ Error: " + result.error);
                } else {
                    window.location.href = result.url;
                }
            } catch (err) {
                console.error(err);
                CustomAlert('Ошибка при отправке кода на сервер.');
            }
        });
    }

    // Обновление CodeMirror после анимации
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
