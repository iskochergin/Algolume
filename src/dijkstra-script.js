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

document.addEventListener("DOMContentLoaded", function() {
  // Initialize CodeMirror for the example code textarea.
  const exampleCodeTextarea = document.getElementById('example-code');
  if (exampleCodeTextarea) {
    window.exampleCM = CodeMirror.fromTextArea(exampleCodeTextarea, {
      lineNumbers: true,
      mode: "python",
      theme: "dracula",
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
      theme: "dracula",
      indentUnit: 4,
      autoCloseBrackets: true
    });
  }

  // Initialize CodeMirror for theory code snippets.
  const snippet1 = document.getElementById('theory-code-snippet-1');
  if (snippet1) {
    const theoryCM1 = CodeMirror.fromTextArea(snippet1, {
      lineNumbers: true,
      mode: "python",
      theme: "dracula",
      indentUnit: 4,
      readOnly: true,
      viewportMargin: Infinity,
      lineWrapping: true
    });
    theoryCM1.getWrapperElement().classList.add('theory-cm');
  }

  const snippet2 = document.getElementById('theory-code-snippet-2');
  if (snippet2) {
    const theoryCM2 = CodeMirror.fromTextArea(snippet2, {
      lineNumbers: true,
      mode: "python",
      theme: "dracula",
      indentUnit: 4,
      readOnly: true,
      viewportMargin: Infinity,
      lineWrapping: true
    });
    theoryCM2.getWrapperElement().classList.add('theory-cm');
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
    closeBtn.onclick = function() {
      modal.style.display = "none";
    };
  }
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  // Set up the run button for the example tab.
  const exampleRunBtn = document.getElementById('exampleRunBtn');
  if (exampleRunBtn && window.exampleCM) {
    exampleRunBtn.addEventListener('click', async function(e) {
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
        parentVar = 'parent';
        graphVar = 'graph';
        distVar = 'dist';
        const response = await fetch('http://127.0.0.1:5000/new-debug-page-dijkstra', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, parentVar, graphVar, distVar })
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
    userRunBtn.addEventListener('click', async function(e) {
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, parentVar: parentVarInput, graphVar: graphVarInput, distVar: distVarInput })
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
        if (window.userCM) window.userCM.refresh();
      }
    });
  }
});
