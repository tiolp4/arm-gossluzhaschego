const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectMode: (mode) => ipcRenderer.invoke('select-mode', mode),
  shutdownComputer: () => ipcRenderer.invoke('shutdown-computer'),
  rebootComputer: () => ipcRenderer.invoke('reboot-computer')
});
