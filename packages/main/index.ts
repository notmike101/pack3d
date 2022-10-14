import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { release } from 'os';
import { Worker } from 'worker_threads';
import { join } from 'path';

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

let mainWin: BrowserWindow | null = null;

const createWindow = () => {
  mainWin = new BrowserWindow({
    title: 'Main window',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      nodeIntegrationInWorker: true,
      // devTools: !app.isPackaged,
      devTools: true,
    },
    resizable: true,
    width: 1000,
    height: 700,
    frame: false,
  });

  mainWin.setMenu(null);

  mainWin.webContents.openDevTools({
    mode: 'undocked',
    activate: true,
  });

  if (app.isPackaged) {
    mainWin.loadFile(join(__dirname, '../renderer/index.html'));
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

ipcMain.on('request-pack', (event: Electron.IpcMainEvent, data: any) => {
  const { sender } = event;
  const worker = new Worker(join(__dirname, '../workers/pack-worker/index.cjs'), { workerData: data });

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
