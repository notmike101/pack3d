/**
 * Licensed Materials - Property of Michael Orozco
 * (C) Copyright Michael Orozco 2022
 */

import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { release } from 'os';
import path from 'path';
import { Worker } from 'worker_threads';

if (release().startsWith('6.1')) app.disableHardwareAcceleration();

if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let mainWin: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWin = new BrowserWindow({
    title: 'Main window',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
      allowRunningInsecureContent: true,
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

  if (app.isPackaged) {
    mainWin.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    const url: string = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`;

    mainWin.loadURL(url);
    mainWin.webContents.openDevTools();
  }

  mainWin.webContents.on('did-finish-load', (): void => {
    mainWin?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  mainWin.webContents.setWindowOpenHandler(({ url }: Electron.HandlerDetails) => {
    if (url.startsWith('https:')) shell.openExternal(url);

    return { action: 'deny' };
  })
}

app.whenReady().then(createWindow);

app.on('window-all-closed', (): void => {
  mainWin = null;

  if (process.platform !== 'darwin') app.quit();
})

app.on('second-instance', (): void => {
  if (mainWin) {
    if (mainWin.isMinimized()) mainWin.restore();

    mainWin.focus();
  }
});

app.on('activate', (): void => {
  const allWindows: BrowserWindow[] = BrowserWindow.getAllWindows();

  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

ipcMain.on('request-pack', async (event, data): Promise<void> => {
  const { sender }: Electron.IpcMainEvent = event;
  const worker: Worker = new Worker(path.join(__dirname, '../workers/pack-worker/index.cjs'), { workerData: data });

  worker.on('message', (result: any): void => {
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

ipcMain.on('menu-close', (): void => {
  mainWin?.close();
});

ipcMain.on('menu-minimize', () => {
  mainWin?.minimize();
});
