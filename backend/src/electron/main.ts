import * as electron from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';
import { logger } from '../utils/logger.ts';

const __dirname = import.meta.dirname;

import { startServer } from '../server.ts';

const { app, protocol, net, ipcMain, shell, BrowserWindow, Tray, Menu } = electron;

let mainWindow: electron.BrowserWindow | null;
let tray: electron.Tray | null = null;

/**
 * Создание Tray иконки и подписка на события
 */
function createTray() {
  try {
    const iconPath = path.join(__dirname, '../../icon-tray.png');

    if (!existsSync(iconPath)) {
      logger.error({ iconPath }, 'Tray icon not found!');
      return;
    }

    tray = new Tray(iconPath);
    tray.setToolTip('Repetitio');
    tray.setContextMenu(createTrayMenu());

    tray.on('click', () => {
      toggleWindow();
    });

    logger.info('Tray created successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to create tray');
  }
}

/**
 * Создание контекстного меню трея
 */
function createTrayMenu(): electron.Menu {
  return Menu.buildFromTemplate([
    {
      label: mainWindow?.isVisible() ? 'Скрыть Repetitio' : 'Показать Repetitio',
      click: () => toggleWindow(),
    },
    { type: 'separator' },
    {
      label: 'Закрыть Repetitio',
      click: () => {
        app.quit();
      },
    },
  ]);
}

/**
 * Обновление контекстного меню трея (для динамического label)
 */
function updateTrayMenu() {
  if (!tray || !mainWindow) return;
  tray.setContextMenu(createTrayMenu());
}

/**
 * Переключение видимости окна
 */
function toggleWindow() {
  if (!mainWindow) return;

  if (!mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    mainWindow.hide();
  }
}

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
  logger.info({ port }, '🚀 Electron started server!');

  const windowConfig = {
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../../icon.png'),
    frame: false, // Убираем рамки
    backgroundMaterial: 'acrylic', // https://www.electronjs.org/docs/latest/api/browser-window#winsetbackgroundmaterialmaterial-windows
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.cjs'),
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
      logger.info({ port }, '🚀 Electron sent port to the app!');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    mainWindow.webContents.openDevTools(); // Открываем DevTools в dev режиме
  }

  // Предотвращаем закрытие окна — вместо этого скрываем его
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  // Обновляем меню трея при изменении видимости окна
  mainWindow.on('show', updateTrayMenu);
  mainWindow.on('hide', updateTrayMenu);

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
    if (win) win.hide();
  });
}

app.on('ready', () => {
  // !!! ВАЖНО: Устанавливаем путь для данных приложения
  process.env.APP_USER_DATA = app.getPath('userData');

  registerIpcHandlers();
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    app.quit();
  }
  // На других платформах приложение продолжает работать
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Cleanup tray before quit
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
