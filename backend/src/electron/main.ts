import * as electron from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';

const __dirname = import.meta.dirname;

import { startServer } from '../server';

const { app, protocol, net, ipcMain, shell, BrowserWindow } = electron;

let mainWindow: electron.BrowserWindow | null;

async function createWindow() {
  // Определяем режим работы и пути
  const isDev = !app.isPackaged;
  const DIST_PATH = isDev
    ? path.join(__dirname, '../../../frontend/dist')
    : path.join(__dirname, '../../frontend-dist');

  // В режиме разработки используем Vite dev server
  const VITE_DEV_SERVER_URL = 'http://localhost:5173';

  // Регистрируем протокол только для production
  if (!isDev) {
    protocol.handle('lmorozanki', (req: Request) => {
      try {
        const requestUrl = new URL(req.url);
        let pathName = decodeURIComponent(requestUrl.pathname);

        if (pathName === '/' || !pathName) pathName = '/index.html';
        const filePath = path.join(DIST_PATH, pathName);

        console.log('--- [DEBUG] DIST_PATH:', DIST_PATH);
        console.log('--- [DEBUG] Target Path:', filePath);

        if (!existsSync(filePath)) {
          console.error('--- [ERROR] File NOT found on disk!');
          return new Response(`File not found: ${filePath}`, { status: 404 });
        }

        const fileUrl = pathToFileURL(filePath).toString();
        return net.fetch(fileUrl).catch((err) => {
          console.error('--- [ERROR] net.fetch failed:', err);
          return new Response('Internal Error', { status: 500 });
        });
      } catch (error) {
        console.error('--- [CRITICAL ERROR] inside protocol handler:', error);
        return new Response('Handler Error', { status: 500 });
      }
    });
  }

  const port = await startServer();

  const windowConfig = {
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../../icon.png'),
    frame: false, // Убираем рамки
    backgroundMaterial: 'acrylic', // https://www.electronjs.org/docs/latest/api/browser-window#winsetbackgroundmaterialmaterial-windows
    autoHideMenuBar: true,
    // fullscreenable: true,
    // hasShadow: true,
    // roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      allowRunningInsecureContent: true,
    },
  };

  const registerHandlers = (win: electron.BrowserWindow) => {
    win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    win.webContents.on('did-finish-load', () => {
      // Отправляем порт бэкенда в рендерер
      win.webContents.send('backend-port', port);
    });

    win.webContents.on('will-navigate', (event: any, url: string) => {
      // В dev режиме разрешаем навигацию по localhost
      if (isDev && url.startsWith('http://localhost:')) {
        return;
      }
      if (!url.startsWith('file://')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });
  };

  // @ts-expect-error: Window config types
  mainWindow = new BrowserWindow(windowConfig);

  registerHandlers(mainWindow);

  // В dev режиме загружаем с Vite dev server, в production - через кастомный протокол
  if (isDev) {
    await mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools(); // Открываем DevTools в dev режиме
  } else {
    await mainWindow.loadURL('lmorozanki://app/index.html');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Регистрируем кастомный протокол только для production (в dev используем Vite dev server)
// Проверяем что protocol доступен (может не быть в некоторых контекстах)
if (process.env.NODE_ENV !== 'development' && protocol) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'lmorozanki',
      privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
    },
  ]);
}

// Global IPC Handlers
function registerIpcHandlers() {
  ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  ipcMain.on('window-toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });
}

app.on('ready', () => {
  // !!! ВАЖНО: Устанавливаем путь для данных приложения
  process.env.APP_USER_DATA = app.getPath('userData');

  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
