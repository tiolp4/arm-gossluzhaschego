const { app, BrowserWindow, ipcMain, dialog, globalShortcut, screen } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow = null;
let choiceWindow = null;
let isKioskMode = false;
let isSelectingMode = false;

// ========================
// ОКНО ВЫБОРА РЕЖИМА
// ========================
function createChoiceWindow() {
  choiceWindow = new BrowserWindow({
    width: 600,
    height: 450,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    frame: false,
    alwaysOnTop: true,
    center: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Выбор режима работы'
  });

  choiceWindow.loadFile('choice.html');
  choiceWindow.setMenuBarVisibility(false);
  console.log('Окно выбора создано');
}

// ========================
// РЕЖИМ КИОСКА (полный экран, нельзя закрыть)
// ========================
function createKioskWindow() {
  isKioskMode = true;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  console.log('Размер экрана:', width, 'x', height);

  try {
    mainWindow = new BrowserWindow({
      width: width,
      height: height,
      x: 0,
      y: 0,
      show: false,
      frame: false,
      closable: false,
      minimizable: false,
      maximizable: false,
      resizable: false,
      movable: false,
      alwaysOnTop: true,
      skipTaskbar: false,
      fullscreen: false,
      kiosk: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      title: 'АРМ Госслужащего'
    });

    console.log('Kiosk окно создано');

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile('index.html');

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Kiosk: страница загружена');
      mainWindow.show();

      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setFullScreen(true);
          mainWindow.focus();
          isSelectingMode = false;
          console.log('Полный экран включён');
        }
      }, 500);
    });

    mainWindow.on('close', (e) => {
      if (!mainWindow.allowClose) {
        e.preventDefault();
      }
    });

    mainWindow.on('blur', () => {
      if (mainWindow && !mainWindow.isDestroyed() && isKioskMode) {
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
          }
        }, 300);
      }
    });

    mainWindow.on('leave-full-screen', () => {
      if (mainWindow && !mainWindow.isDestroyed() && isKioskMode) {
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setFullScreen(true);
          }
        }, 200);
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
      isKioskMode = false;
      unblockShortcuts();
    });

    blockShortcuts();
    console.log('Режим киоска настроен');

  } catch (error) {
    console.error('ОШИБКА создания kiosk окна:', error);
    isSelectingMode = false;
  }
}

// ========================
// БЛОКИРОВКА КЛАВИШ
// ========================
function blockShortcuts() {
  const shortcuts = [
    'Alt+F4', 'Alt+Tab', 'CommandOrControl+Q', 'CommandOrControl+W',
    'CommandOrControl+F4', 'Alt+F2', 'Alt+F1', 'F11', 'Escape',
    'CommandOrControl+Escape', 'Alt+Escape'
  ];
  shortcuts.forEach(s => {
    try { globalShortcut.register(s, () => {}); } catch(e) {}
  });
  console.log('Горячие клавиши заблокированы');
}

function unblockShortcuts() {
  globalShortcut.unregisterAll();
}

// ========================
// IPC
// ========================
ipcMain.handle('select-mode', (event, mode) => {
  console.log('--- select-mode:', mode, '---');

  if (mode === 'normal') {
    // ОБЫЧНЫЙ РЕЖИМ — просто закрываем всё и выходим
    console.log('Обычный режим — закрываем приложение, работа в ОС');

    if (choiceWindow && !choiceWindow.isDestroyed()) {
      choiceWindow.removeAllListeners('close');
      choiceWindow.destroy();
      choiceWindow = null;
    }

    // Выходим из приложения — пользователь работает в ОС
    app.quit();
    return true;
  }

  if (mode === 'kiosk') {
    // РЕЖИМ РАБОТЫ — открываем панель на весь экран
    isSelectingMode = true;

    // Сначала создаём kiosk окно
    createKioskWindow();

    // Потом закрываем окно выбора
    if (choiceWindow && !choiceWindow.isDestroyed()) {
      choiceWindow.removeAllListeners('close');
      choiceWindow.destroy();
      choiceWindow = null;
      console.log('Окно выбора уничтожено');
    }

    return true;
  }
});

ipcMain.handle('shutdown-computer', async () => {
  const win = mainWindow || BrowserWindow.getFocusedWindow();
  const result = await dialog.showMessageBox(win, {
    type: 'warning',
    title: 'Выключение компьютера',
    message: 'Вы уверены, что хотите выключить компьютер?',
    detail: 'Все несохранённые данные будут потеряны.',
    buttons: ['Отмена', 'Выключить'],
    defaultId: 0,
    cancelId: 0
  });

  if (result.response === 1) {
    if (mainWindow) mainWindow.allowClose = true;
    isKioskMode = false;
    unblockShortcuts();
    exec('systemctl poweroff', (error) => {
      if (error) exec('shutdown -h now', () => {});
    });
    return true;
  }
  return false;
});

ipcMain.handle('reboot-computer', async () => {
  const win = mainWindow || BrowserWindow.getFocusedWindow();
  const result = await dialog.showMessageBox(win, {
    type: 'warning',
    title: 'Перезагрузка',
    message: 'Перезагрузить компьютер?',
    buttons: ['Отмена', 'Перезагрузить'],
    defaultId: 0,
    cancelId: 0
  });

  if (result.response === 1) {
    if (mainWindow) mainWindow.allowClose = true;
    isKioskMode = false;
    unblockShortcuts();
    exec('systemctl reboot', (error) => {
      if (error) exec('reboot', () => {});
    });
    return true;
  }
  return false;
});

// ========================
// ЗАПУСК
// ========================
app.whenReady().then(() => {
  console.log('Приложение готово');
  createChoiceWindow();
});

app.on('window-all-closed', () => {
  console.log('window-all-closed, isSelectingMode:', isSelectingMode);

  if (isSelectingMode) {
    console.log('Переключение режима — не закрываем');
    return;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
