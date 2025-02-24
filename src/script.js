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
