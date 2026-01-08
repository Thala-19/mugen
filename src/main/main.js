const { app, BrowserWindow, WebContentsView, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow;
const viewRegistry = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      contextIsolation: false, // allow renderer to reach ipcRenderer via window.require
      nodeIntegration: true,
      sandbox: false,
      webviewTag: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('closed', () => {
    for (const view of viewRegistry.values()) {
      try {
        view.webContents.destroy();
      } catch {}
    }
    viewRegistry.clear();
    app.quit();
  });
}

ipcMain.on('TAB_kb_CREATE', (_event, payload) => {
  if (!payload?.id || !mainWindow) return;
  const { id, url = 'about:blank' } = payload;

  let view = viewRegistry.get(id);
  if (!view) {
    view = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });
    view.setBackgroundColor('#00000000');
    mainWindow.contentView.addChildView(view);
    viewRegistry.set(id, view);
  }

  view.setBounds(payload.bounds ?? { x: 0, y: 0, width: 0, height: 0 });
  view.webContents.loadURL(url);
});

ipcMain.on('TAB_UPDATE_BOUNDS', (_event, payload) => {
  const { id, bounds } = payload || {};
  const view = viewRegistry.get(id);
  if (!view || !bounds) return;
  view.setBounds(bounds);
});

ipcMain.on('TAB_zb_wc_DESTROY', (_event, payload) => {
  const { id } = payload || {};
  const view = viewRegistry.get(id);
  if (!view || !mainWindow) return;
  try {
    mainWindow.contentView.removeChildView(view);
    view.webContents.destroy();
  } catch {}
  viewRegistry.delete(id);
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});