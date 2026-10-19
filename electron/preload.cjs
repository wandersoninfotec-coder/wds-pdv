const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printCupom: (html) => ipcRenderer.invoke('print-cupom', html),
});