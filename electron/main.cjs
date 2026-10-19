const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

// Aceita cert self-signed do CliSiTef (127.0.0.1:8443)
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-features', 'BlockInsecurePrivateNetworkRequests');

let mainWindow = null;

function criarJanela() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://192.168.100.67:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(criarJanela);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) criarJanela();
});

// Impressão silenciosa de cupom
ipcMain.handle('print-cupom', async (event, html) => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true },
  });

  const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  await win.loadURL(dataUrl);

  return new Promise((resolve) => {
    win.webContents.print(
      {
        silent: true,
        printBackground: true,
        margins: { marginType: 'none' },
        pageSize: { width: 80000, height: 297000 },
      },
      (success, failureReason) => {
        win.close();
        resolve({ success, failureReason });
      }
    );
  });
});