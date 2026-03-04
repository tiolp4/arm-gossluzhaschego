const powerBtn = document.getElementById('powerBtn');
const powerMenu = document.getElementById('powerMenu');
const shutdownBtn = document.getElementById('shutdownBtn');
const rebootBtn = document.getElementById('rebootBtn');

// Открыть/закрыть меню по клику на кнопку питания
powerBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  powerMenu.classList.toggle('visible');
});

// Закрыть меню при клике в любое другое место
document.addEventListener('click', (e) => {
  if (!powerMenu.contains(e.target) && e.target !== powerBtn) {
    powerMenu.classList.remove('visible');
  }
});

// Закрыть меню при нажатии Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    powerMenu.classList.remove('visible');
  }
});

// Выключить
shutdownBtn.addEventListener('click', async () => {
  powerMenu.classList.remove('visible');
  if (window.electronAPI) {
    await window.electronAPI.shutdownComputer();
  }
});

// Перезагрузить
rebootBtn.addEventListener('click', async () => {
  powerMenu.classList.remove('visible');
  if (window.electronAPI) {
    await window.electronAPI.rebootComputer();
  }
});
