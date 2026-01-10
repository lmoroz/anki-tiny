# Design: System Tray Integration

## Architecture Overview

Интеграция с системным треем реализуется исключительно в **Electron main process** (`backend/src/electron/main.ts`) с использованием Electron Tray API. Frontend не требует изменений, кроме опциональной корректировки tooltip.

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      BrowserWindow (mainWindow)   │  │
│  │                                   │  │
│  │  State:                           │  │
│  │  - visible / hidden               │  │
│  │  - minimized / restored           │  │
│  │                                   │  │
│  │  Events:                          │  │
│  │  - 'close' → prevent + hide       │  │
│  │  - 'minimize' → optional tray     │  │
│  │  - IPC 'window-close' → hide      │  │
│  └───────────────────────────────────┘  │
│                ▲                        │
│                │                        │
│                │ toggle visibility      │
│                │                        │
│  ┌─────────────┴─────────────────────┐  │
│  │         Tray                      │  │
│  │                                   │  │
│  │  Icon: icon-tray.png              │  │
│  │  Tooltip: "Repetitio"             │  │
│  │                                   │  │
│  │  Events:                          │  │
│  │  - click → toggleWindow()         │  │
│  │  - right-click → context menu     │  │
│  │                                   │  │
│  │  Menu:                            │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ Показать/Скрыть Repetitio   │  │  │
│  │  │ ──────────────────────────  │  │  │
│  │  │ Закрыть Repetitio           │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  App Lifecycle:                         │
│  - app.on('ready') → createTray()       │
│  - app.on('before-quit') → tray.destroy()│
└─────────────────────────────────────────┘
```

## Components Design

### 1. Tray Component

**Файл**: `backend/src/electron/main.ts`

**Lifecycle**:

```typescript
let tray: Tray | null = null;

function createTray() {
  const iconPath = path.join(__dirname, "../../icon-tray.png");
  tray = new Tray(iconPath);

  tray.setToolTip("Repetitio");
  tray.setContextMenu(createTrayMenu());

  tray.on("click", () => {
    toggleWindow();
  });
}

function createTrayMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: mainWindow?.isVisible() ? "Скрыть Repetitio" : "Показать Repetitio",
      click: () => toggleWindow(),
    },
    { type: "separator" },
    {
      label: "Закрыть Repetitio",
      click: () => {
        app.quit();
      },
    },
  ]);
}
```

### 2. Window Toggle Logic

```typescript
function toggleWindow() {
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function hideWindow() {
  if (!mainWindow) return;
  mainWindow.hide();
}
```

### 3. Window Close Prevention

**Изменение поведения события `close`**:

```typescript
mainWindow.on("close", (event) => {
  // Prevent default close behavior
  event.preventDefault();
  hideWindow();
});
```

**Обновление IPC handler**:

```typescript
ipcMain.on("window-close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    hideWindow(); // Вместо win.close()
  }
});
```

### 4. True Quit Logic

**Добавление нового IPC handler для полного завершения**:

```typescript
ipcMain.on("app-quit", () => {
  app.quit();
});
```

**App lifecycle handling**:

```typescript
app.on("before-quit", () => {
  // Cleanup tray before quit
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on("window-all-closed", () => {
  // Не завершать приложение на Windows/Linux
  // macOS оставляем как есть (стандартное поведение)
  if (process.platform === "darwin") {
    app.quit();
  }
  // На других платформах приложение продолжает работать с tray
});
```

## Platform-Specific Considerations

### Windows

- **Tray Position**: Правый нижний угол taskbar
- **Menu Trigger**: Правый клик или левый клик (в зависимости от настроек)
- **Icon**: Рекомендуется 16x16 или 32x32 PNG с прозрачностью
- **Behavior**: При показе окна оно также появляется в taskbar (стандартное поведение)

### macOS

- **Tray Position**: Menu bar сверху справа
- **Menu Trigger**: Левый клик
- **Icon**: Рекомендуется Template Image (черно-белая иконка с альфа-каналом)
- **Behavior**: Может потребоваться `app.dock.hide()` для скрытия иконки в Dock
- **Naming**: Используется "Menu Bar" вместо "System Tray"

### Linux

- **Tray Position**: Зависит от DE (GNOME, KDE, XFCE)
- **Icon**: 22x22 или 24x24 PNG
- **Compatibility**: Некоторые DE не поддерживают tray (GNOME 3+), требуется расширение

**Решение для кроссплатформенности**:

- Использовать единую PNG иконку 32x32 с прозрачностью
- Проверить наличие Tray через `Tray.isSupported()` (опционально)
- Для macOS можно использовать отдельную Template Image в будущем

## State Management

### Window State Transitions

```
┌──────────┐
│  Visible │ ◄─────┐
│  Focused │       │
└────┬─────┘       │
     │             │
     │ hide()      │ show()
     │             │
     ▼             │
┌──────────┐       │
│  Hidden  ├───────┘
└────┬─────┘
     │
     │ (Tray Icon visible)
     │
     ▼
```

### Menu Label Dynamic Update

Контекстное меню трея динамически обновляет текст первого пункта в зависимости от состояния окна:

- Окно видимо → "Скрыть Repetitio"
- Окно скрыто → "Показать Repetitio"

**Реализация**:

```typescript
function updateTrayMenu() {
  if (!tray || !mainWindow) return;

  const isVisible = mainWindow.isVisible();
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: isVisible ? "Скрыть Repetitio" : "Показать Repetitio",
        click: () => toggleWindow(),
      },
      { type: "separator" },
      {
        label: "Закрыть Repetitio",
        click: () => app.quit(),
      },
    ]),
  );
}

// Вызывать после show/hide
mainWindow.on("show", updateTrayMenu);
mainWindow.on("hide", updateTrayMenu);
```

## Error Handling

### Tray Creation Failure

```typescript
function createTray() {
  try {
    const iconPath = path.join(__dirname, "../../icon-tray.png");

    if (!existsSync(iconPath)) {
      logger.error({ iconPath }, "Tray icon not found!");
      return;
    }

    tray = new Tray(iconPath);
    tray.setToolTip("Repetitio");
    tray.setContextMenu(createTrayMenu());
    tray.on("click", toggleWindow);

    logger.info("Tray created successfully");
  } catch (error) {
    logger.error({ error }, "Failed to create tray");
    // Fallback: разрешить полное закрытие окна
  }
}
```

### Graceful Degradation

Если Tray не удалось создать:

- Приложение продолжает работать в обычном режиме
- Кнопка закрытия работает как стандартное закрытие окна (`app.quit()`)
- Логируется ошибка для диагностики

## Security Considerations

- **IPC Validation**: Убедиться, что IPC handlers принимают только ожидаемые сообщения
- **Resource Cleanup**: Tray должен быть корректно уничтожен при завершении приложения
- **Icon Path Security**: Использовать абсолютные пути и проверять существование файла

## Performance Considerations

- **Memory**: Tray занимает минимальные ресурсы (~10KB RAM)
- **CPU**: Обработка событий трея не создаёт нагрузки
- **Icon Size**: Рекомендуется PNG 32x32 (~5KB) для быстрой загрузки

## Future Enhancements

- **Badge Count**: Отображение количества due карточек на иконке трея
- **Settings Integration**: Опция "Закрывать полностью вместо сворачивания"
- **macOS Template Icon**: Использование Template Image для адаптации под системную тему
- **Notification Integration**: Клик по уведомлению открывает окно через tray
- **Minimize to Tray Option**: Опция сворачивания в трей при минимизации окна

## Testing Strategy

### Manual Testing Checklist

- [ ] Tray icon видим в системном трее
- [ ] Tooltip отображается при наведении на иконку
- [ ] Левый клик на tray → окно показывается/скрывается
- [ ] Правый клик на tray → контекстное меню открывается
- [ ] Пункт меню "Показать Repetitio" → окно показывается
- [ ] Пункт меню "Скрыть Repetitio" → окно скрывается
- [ ] Пункт меню "Закрыть Repetitio" → приложение полностью завершается
- [ ] Кнопка закрытия окна (крестик) → окно скрывается (не завершается)
- [ ] После скрытия процесс Electron продолжает работать
- [ ] При показе окна оно восстанавливает прежний размер/позицию
- [ ] Tray корректно удаляется при полном завершении приложения

### Platform Testing

- [ ] Windows 10/11 — tray в правом нижнем углу
- [ ] macOS — иконка в menu bar
- [ ] Linux (Ubuntu + GNOME) — проверить наличие tray support

## Dependencies

- **Electron Tray API**: `electron.Tray` (доступен в v39+)
- **Electron Menu API**: `electron.Menu.buildFromTemplate()`
- **Electron App API**: `app.quit()`, `app.on('before-quit')`
- **Existing**: `logger` из `backend/src/utils/logger.ts`

## Breaking Changes

**Нет breaking changes**. Изменяется только поведение кнопки закрытия окна:

- **Было**: Закрытие окна → завершение процесса
- **Стало**: Закрытие окна → скрытие в трей

Пользователи всё ещё могут завершить приложение через контекстное меню трея.
