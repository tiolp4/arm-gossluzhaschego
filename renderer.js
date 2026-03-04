const powerBtn = document.getElementById('powerBtn');
const powerMenu = document.getElementById('powerMenu');
const shutdownBtn = document.getElementById('shutdownBtn');
const rebootBtn = document.getElementById('rebootBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Открыть/закрыть меню
powerBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  powerMenu.classList.toggle('visible');
});

// Закрыть при клике вне меню
document.addEventListener('click', (e) => {
  if (!powerMenu.contains(e.target) && e.target !== powerBtn) {
    powerMenu.classList.remove('visible');
  }
});

// Закрыть по Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    powerMenu.classList.remove('visible');
  }
});

// Выйти из системы
logoutBtn.addEventListener('click', async () => {
  powerMenu.classList.remove('visible');
  if (window.electronAPI) {
    await window.electronAPI.logoutUser();
  }
});

// Перезагрузить
rebootBtn.addEventListener('click', async () => {
  powerMenu.classList.remove('visible');
  if (window.electronAPI) {
    await window.electronAPI.rebootComputer();
  }
});

// Выключить
shutdownBtn.addEventListener('click', async () => {
  powerMenu.classList.remove('visible');
  if (window.electronAPI) {
    await window.electronAPI.shutdownComputer();
  }
});
