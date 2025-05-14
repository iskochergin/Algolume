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


/* ───────────── Algolume Neuro logic ───────────── */
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
    .addEventListener('click', async () => {
      const code = cm.getValue();
      if (!code.trim()) { alert('Вставьте код'); return; }

      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (!res.ok) { alert('Ошибка сервера'); return; }
      const data = await res.json();
      showPrediction(data.predictions);
    });

  // отправка исправления
  document.getElementById('correction-btn')
    .addEventListener('click', async () => {
      const correct = document.getElementById('correction-select').value;
      const code = cm.getValue();
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct, code })
      });
      alert('Спасибо, поправили!');
    });
});

function showPrediction(list) {
  const area   = document.getElementById('prediction-area');
  const listDiv= document.getElementById('prediction-list');
  const select = document.getElementById('correction-select');

  listDiv.innerHTML = '';
  select.innerHTML  = '';

  list.forEach(([cls, prob], idx) => {
    const p = document.createElement('p');
    p.innerHTML = `${idx + 1}. <strong>${cls}</strong> — ${(prob * 100).toFixed(1)}%`;
    listDiv.appendChild(p);

    const opt = document.createElement('option');
    opt.value = cls;
    opt.textContent = cls;
    select.appendChild(opt);
  });
  area.classList.remove('hidden');
}
