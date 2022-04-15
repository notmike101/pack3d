import { app, BrowserWindow, shell, ipcMain, ipcRenderer } from 'electron';
import { release } from 'os';
import { join as pathJoin } from 'path';
import { Worker } from 'worker_threads';
import packWorker from './worker.js?raw';

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
      preload: pathJoin(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
      allowRunningInsecureContent: true,
      webSecurity: false,
    },
    resizable: true,
    width: 1500,
    height: 1000,
  });

  mainWin.setMenu(null);

  if (app.isPackaged) {
    mainWin.loadFile(pathJoin(__dirname, '../renderer/index.html'));
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
  const worker: Worker = new Worker(packWorker, { eval: true });
  const { sender }: Electron.IpcMainEvent = event;

  worker.on('message', (result: any): void => {
    if (result.type === 'logging') {
      sender.send('logging', result);
    } else if (result.type === 'errorreport') {
      sender.send('pack-error', result);
    } else if (result.type === 'sizereport') {
      sender.send('pack-sizereport', result);
    } else if (result.type === 'packreport') {
      sender.send('pack-success', result);
    }
  });

  worker.postMessage(data);
});

