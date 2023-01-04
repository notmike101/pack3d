import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { release } from 'os';
import { Worker } from 'worker_threads';
import path from 'path';
import Store from 'electron-store';

import type { IPackJobRequest } from 'types';

if (release().startsWith('6.1')) {
  app.disableHardwareAcceleration();
}

if (process.platform === 'win32') {
  app.setAppUserModelId(app.getName());
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

autoUpdater.checkForUpdatesAndNotify();

let mainWin: BrowserWindow | null = null;
let helpWin: BrowserWindow | null = null;

const createWindow = () => {
  Store.initRenderer();

  mainWin = new BrowserWindow({
    title: 'Main window',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      nodeIntegrationInWorker: true,
      devTools: !app.isPackaged,
    },
    resizable: true,
    width: 1000,
    height: 700,
    frame: false,
  });

  mainWin.setMenu(null);

  if (!app.isPackaged) {
    mainWin.webContents.openDevTools({
      mode: 'undocked',
      activate: true,
    });
  }

  if (app.isPackaged) {
    mainWin.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`;

    mainWin.loadURL(url);
  }

  mainWin.webContents.on('did-finish-load', () => {
    mainWin?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      shell.openExternal(url);
    }

    return { action: 'deny' };
  })
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  mainWin = null;

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', () => {
  if (mainWin) {
    if (mainWin.isMinimized()) {
      mainWin.restore();
    }

    mainWin.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();

  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

ipcMain.on('request-pack', (event: Electron.IpcMainEvent, data: IPackJobRequest) => {
  const { sender } = event;
  const worker = new Worker(path.join(__dirname, '../workers/pack-worker/index.cjs'), { workerData: data });

  worker.on('message', (result: any) => {
    if (result.type === 'logging') {
      sender.send('logging', result);
    } else if (result.type === 'errorreport') {
      sender.send('pack-error', result);
    } else if (result.type === 'sizereport') {
      sender.send('pack-sizereport', result);
    } else if (result.type === 'packreport') {
      sender.send('pack-success', result);
      worker.terminate();
    }
  });
});

ipcMain.on('menu-close', () => {
  mainWin?.close();
});

ipcMain.on('menu-minimize', () => {
  mainWin?.minimize();
});

ipcMain.on('menu-help', () => {
  helpWin = new BrowserWindow({
    title: 'Pack3D Help',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      nodeIntegrationInWorker: true,
      devTools: !app.isPackaged,
    },
    resizable: true,
    width: 600,
    height: 500,
    frame: true,
  });

  helpWin.setMenu(null);

  if (app.isPackaged) {
    helpWin.loadFile(path.join(__dirname, '../renderer/help.html'));
  } else {
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}/help.html`;

    helpWin.loadURL(url);
    helpWin.webContents.openDevTools();
  }
})
