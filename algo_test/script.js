exampleTab.classList.remove('hidden');
exampleTabBtn.classList.add('active-tab');
if (window.exampleCM) window.exampleCM.refresh();

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

  // Сначала прячем обе вкладки
  exampleTab.classList.add('hidden');
  userTab.classList.add('hidden');

  // Снимаем активность с обеих кнопок
  exampleTabBtn.classList.remove('active-tab');
  userTabBtn.classList.remove('active-tab');

  // Включаем нужную вкладку
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

/* Инициализация CodeMirror и остальная логика */
document.addEventListener("DOMContentLoaded", function() {
  // CodeMirror для "Пример кода" (readOnly)
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

  // CodeMirror для "Ваш код" (редактируемый)
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

  // CodeMirror для теоретических блоков (readOnly)
  const snippet1 = document.getElementById('theory-code-snippet-1');
  if (snippet1) {
    const theoryCM1 = CodeMirror.fromTextArea(snippet1, {
      lineNumbers: true,
      mode: "python",
      theme: "dracula",
      indentUnit: 4,
      readOnly: true,
      viewportMargin: Infinity,  // Автоматическая высота по содержимому
      lineWrapping: true         // Перенос длинных строк
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

  const snippet3 = document.getElementById('theory-code-snippet-3');
  if (snippet3) {
    const theoryCM3 = CodeMirror.fromTextArea(snippet3, {
      lineNumbers: true,
      mode: "python",
      theme: "dracula",
      indentUnit: 4,
      readOnly: true,
      viewportMargin: Infinity,
      lineWrapping: true
    });
    theoryCM3.getWrapperElement().classList.add('theory-cm');
  }


  // Модальное окно (Custom Alert)
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

  // Кнопка "Запустить" для Примера
  const exampleRunBtn = document.getElementById('exampleRunBtn');
  if (exampleRunBtn && window.exampleCM) {
    exampleRunBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      const code = window.exampleCM.getValue();

      // Проверка на длину кода
      const maxCodeLines = 300;
      const codeLines = code.split('\n').length;
      if (codeLines > maxCodeLines) {
        CustomAlert('The code is too large! The maximum number of lines is 300.');
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:5000/new-debug-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const debugging_result = await response.json();
        if (debugging_result.execution_time > 5 || debugging_result.memory_used > 256) {
          CustomAlert(`Memory/Time limit exceeded. Time: ${debugging_result.execution_time} seconds. Memory: ${debugging_result.memory_used} MB.`);
        } else if (debugging_result.error) {
          CustomAlert("‼️ Error: " + debugging_result.error);
        } else {
          window.location.href = debugging_result.url;
        }
      } catch (error) {
        console.error('Fetch error:', error);
        CustomAlert('Error sending example code to server.');
      }
    });
  }

  // Кнопка "Запустить" для пользовательского кода
  const userRunBtn = document.getElementById('userRunBtn');
  if (userRunBtn && window.userCM) {
    userRunBtn.addEventListener('click', async function(event) {
      event.preventDefault();
      const code = window.userCM.getValue();

      // Проверяем обязательные переменные
      const dpVar = document.getElementById('var-dp')?.value.trim();
      const pathVar = document.getElementById('var-path')?.value.trim();
      const currentPosVar = document.getElementById('var-currentPosition')?.value.trim();

      if (!dpVar || !pathVar || !currentPosVar) {
        CustomAlert("Пожалуйста, заполните все переменные в таблице.");
        return;
      }
      if (!code.includes(dpVar)) {
        CustomAlert(`Переменная "${dpVar}" не найдена в вашем коде.`);
        return;
      }
      if (!code.includes(pathVar)) {
        CustomAlert(`Переменная "${pathVar}" не найдена в вашем коде.`);
        return;
      }
      if (!code.includes(currentPosVar)) {
        CustomAlert(`Переменная "${currentPosVar}" не найдена в вашем коде.`);
        return;
      }

      // Проверка на длину кода
      const maxCodeLines = 300;
      const codeLines = code.split('\n').length;
      if (codeLines > maxCodeLines) {
        CustomAlert('The code is too large! The maximum number of lines is 300.');
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:5000/new-debug-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const debugging_result = await response.json();
        if (debugging_result.execution_time > 5 || debugging_result.memory_used > 256) {
          CustomAlert(`Memory/Time limit exceeded. Time: ${debugging_result.execution_time} seconds. Memory: ${debugging_result.memory_used} MB.`);
        } else if (debugging_result.error) {
          CustomAlert("‼️ Error: " + debugging_result.error);
        } else {
          window.location.href = debugging_result.url;
        }
      } catch (error) {
        console.error('Fetch error:', error);
        CustomAlert('Error sending input to server.');
      }
    });
  }

  // При окончании анимации сдвига контейнера — рефреш CodeMirror
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
