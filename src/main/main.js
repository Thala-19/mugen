const { app, BrowserWindow, WebContentsView, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow;
const viewRegistry = new Map();
const lastBounds = new Map(); // Track last known bounds for each view

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
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
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
    lastBounds.clear();
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

  // Convert screen coordinates to window-relative coordinates
  const windowBounds = mainWindow.getBounds();
  const screenBounds = payload.bounds ?? { x: 0, y: 0, width: 0, height: 0 };
  const bounds = {
    x: screenBounds.x - windowBounds.x,
    y: screenBounds.y - windowBounds.y,
    width: screenBounds.width,
    height: screenBounds.height
  };
  
  console.log('Creating view - Window at:', windowBounds, 'Screen bounds:', screenBounds, 'Relative bounds:', bounds);
  
  view.setBounds(bounds);
  lastBounds.set(id, bounds); // Store the bounds
  view.webContents.loadURL(url);
});

ipcMain.on('TAB_UPDATE_BOUNDS', (_event, payload) => {
  const { id, bounds } = payload || {};
  const view = viewRegistry.get(id);
  if (!view || !bounds || !mainWindow) return;
  
  // Convert screen coordinates to window-relative coordinates
  const windowBounds = mainWindow.getBounds();
  const relativeBounds = {
    x: bounds.x - windowBounds.x,
    y: bounds.y - windowBounds.y,
    width: bounds.width,
    height: bounds.height
  };
  
  console.log('Updating view bounds - Window at:', windowBounds, 'Screen:', bounds, 'Relative:', relativeBounds);
  
  view.setBounds(relativeBounds);
  lastBounds.set(id, relativeBounds); // Store the relative bounds
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
  lastBounds.delete(id);
});

ipcMain.on('OMNIBOX_TOGGLE', (_event, isOpen) => {
  if (isOpen) {
    // Hide all WebContentsViews when omnibox is open to prevent z-index issues
    for (const view of viewRegistry.values()) {
      try {
        view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      } catch {}
    }
  } else {
    // Restore all WebContentsViews to their last known bounds when omnibox closes
    for (const [id, bounds] of lastBounds.entries()) {
      const view = viewRegistry.get(id);
      if (view && bounds) {
        try {
          view.setBounds(bounds);
        } catch {}
      }
    }
  }
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