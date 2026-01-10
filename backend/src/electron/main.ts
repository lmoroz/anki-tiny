import * as electron from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { existsSync, appendFileSync } from 'fs';
import { logger } from '../utils/logger.js';

import { startServer } from '../server.js';

// ============================================
// ДИАГНОСТИКА: Файловое логирование main process
// ============================================
let LOG_FILE: string;

function logToFile(message: string) {
  if (!LOG_FILE) return; // Ещё не инициализирован
  try {
    const timestamp = new Date().toISOString();
    appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf-8');
  } catch (_err) {
    // Игнорируем ошибки записи в лог
  }
}

// Перехватываем console.log/error
const originalLog = console.log;
const originalError = console.error;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.log = (...args: any[]) => {
  const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
  logToFile(`[LOG] ${message}`);
  originalLog(...args);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.error = (...args: any[]) => {
  const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
  logToFile(`[ERROR] ${message}`);
  originalError(...args);
};

// Перехватываем необработанные исключения
process.on('uncaughtException', (error) => {
  logToFile(`[UNCAUGHT EXCEPTION] ${error.stack || error.message}`);
  originalError('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  logToFile(`[UNHANDLED REJECTION] ${reason}`);
  originalError('Unhandled Rejection:', reason);
});

/**
 * Инициализация лог-файла (вызывается после app.ready)
 */
function setupFileLogging() {
  LOG_FILE = path.join(electron.app.getPath('userData'), 'electron-main.log');
  console.log('[MAIN] === Electron Main Process Started ===');
  console.log(`[MAIN] getAppPath: ${electron.app.getAppPath()}`);
  console.log(`[MAIN] userData: ${electron.app.getPath('userData')}`);
}

const { app, protocol, net, ipcMain, shell, BrowserWindow, Tray, Menu } = electron;

let mainWindow: electron.BrowserWindow | null;
let tray: electron.Tray | null = null;

/**
 * Создание Tray иконки и подписка на события
 */
function createTray() {
  console.log('[MAIN] [TRAY] Starting createTray()');
  try {
    const iconPath = path.join(__dirname, '../../icon-tray.png');
    console.log('[MAIN] [TRAY] Icon path:', iconPath);

    if (!existsSync(iconPath)) {
      logger.error({ iconPath }, 'Tray icon not found!');
      return;
    }

    tray = new Tray(iconPath);
    console.log('[MAIN] [TRAY] Tray instance created');
    tray.setToolTip('Repetitio');
    tray.setContextMenu(createTrayMenu());

    tray.on('click', () => {
      console.log('[MAIN] [TRAY] Tray clicked');
      toggleWindow();
    });

    logger.info('Tray created successfully');
    console.log('[MAIN] [TRAY] ✅ Tray fully initialized');
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
  console.log('[MAIN] [WINDOW] Starting createWindow()');
  // Определяем режим работы и пути
  const isDev = !app.isPackaged;
  console.log('[MAIN] [WINDOW] isDev:', isDev, 'isPackaged:', app.isPackaged);
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

        console.log('[MAIN] --- [DEBUG] DIST_PATH:', DIST_PATH);
        console.log('[MAIN] --- [DEBUG] Target Path:', filePath);

        if (!existsSync(filePath)) {
          console.error('[MAIN] --- [ERROR] File NOT found on disk!');
          return new Response(`File not found: ${filePath}`, { status: 404 });
        }

        const fileUrl = pathToFileURL(filePath).toString();
        return net.fetch(fileUrl).catch((err) => {
          console.error('[MAIN] --- [ERROR] net.fetch failed:', err);
          return new Response('Internal Error', { status: 500 });
        });
      } catch (error) {
        console.error('[MAIN] --- [CRITICAL ERROR] inside protocol handler:', error);
        return new Response('Handler Error', { status: 500 });
      }
    });
  }

  console.log('[MAIN] [WINDOW] Starting backend server...');
  const port = await startServer();
  logger.info({ port }, '🚀 Electron started server!');
  console.log('[MAIN] [WINDOW] ✅ Backend server started on port:', port);

  const windowConfig = {
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../../icon.png'),
    frame: false, // Убираем рамки
    backgroundMaterial: 'acrylic' as const, // https://www.electronjs.org/docs/latest/api/browser-window#winsetbackgroundmaterialmaterial-windows
    autoHideMenuBar: true,
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

  console.log('[MAIN] [WINDOW] Creating BrowserWindow instance...');
  mainWindow = new BrowserWindow(windowConfig);
  console.log('[MAIN] [WINDOW] ✅ BrowserWindow created');

  registerHandlers(mainWindow);
  console.log('[MAIN] [WINDOW] Handlers registered');

  // В dev режиме загружаем с Vite dev server, в production - через кастомный протокол
  if (isDev) {
    console.log('[MAIN] [WINDOW] Loading URL:', VITE_DEV_SERVER_URL);
    await mainWindow.loadURL(VITE_DEV_SERVER_URL);
    console.log('[MAIN] [WINDOW] ✅ URL loaded (dev mode)');
    mainWindow.webContents.openDevTools(); // Открываем DevTools в dev режиме
  } else {
    console.log('[MAIN] [WINDOW] Loading URL: lmorozanki://app/index.html');
    await mainWindow.loadURL('lmorozanki://app/index.html');
    console.log('[MAIN] [WINDOW] ✅ URL loaded (production mode)');
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

// ============================================
// ВАЖНО: Устанавливаем имя приложения ДО app.ready
// ============================================
// Electron использует app.getName() для определения пути userData
// По умолчанию берётся из package.json "name", но нам нужно "repetitio"
app.setName('repetitio');

app.on('ready', () => {
  // Инициализируем логирование ПЕРВЫМ ДЕЛОМ
  setupFileLogging();

  console.log('[MAIN] [APP] ===== App Ready Event Fired =====');
  // !!! ВАЖНО: Устанавливаем путь для данных приложения
  process.env.APP_USER_DATA = app.getPath('userData');
  console.log('[MAIN] [APP] APP_USER_DATA:', process.env.APP_USER_DATA);

  registerIpcHandlers();
  console.log('[MAIN] [APP] IPC Handlers registered');

  console.log('[MAIN] [APP] Calling createWindow()...');
  createWindow().catch((err) => {
    console.error('[MAIN] [APP] ❌ FATAL: createWindow() failed:', err);
  });

  console.log('[MAIN] [APP] Calling createTray()...');
  createTray();

  console.log('[MAIN] [APP] ===== Initialization Complete =====');
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
