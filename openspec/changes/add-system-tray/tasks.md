# Tasks: System Tray Integration

## Phase 1: Tray Infrastructure Setup

### Task 1.1: Create Tray Icon Asset

**Duration**: 15 минут

**Dependencies**: None

- [ ] Создать PNG иконку для трея размером 32x32 пикселя с прозрачностью
- [ ] Сохранить файл как `backend/icon-tray.png`
- [ ] Убедиться, что иконка визуально различима на светлом и тёмном фоне
- [ ] Проверить размер файла (\<10KB для быстрой загрузки)
- [ ] **Validation**: Файл `backend/icon-tray.png` существует
- [ ] **Validation**: Иконка читаема в Preview/Просмотр фотографий
- [ ] **Validation**: Прозрачность корректно отображается

---

### Task 1.2: Implement createTray Function

**Duration**: 1 час

**Dependencies**: Task 1.1

- [ ] Добавить импорт `Tray` и `Menu` из `electron` в `backend/src/electron/main.ts`
- [ ] Создать глобальную переменную `let tray: Tray | null = null;` в начале файла
- [ ] Реализовать функцию `createTray()` с логикой:
  - Построить путь к иконке: `path.join(__dirname, '../../icon-tray.png')`
  - Проверить существование файла через `existsSync(iconPath)`
  - Если файл существует:
    - Создать `tray = new Tray(iconPath)`
    - Установить tooltip: `tray.setToolTip('Repetitio')`
    - Установить контекстное меню (вызов `createTrayMenu()`)
    - Подписаться на событие click: `tray.on('click', toggleWindow)`
  - Если файл НЕ существует:
    - Логировать ошибку: `logger.error({ iconPath }, 'Tray icon not found!')`
    - Вернуться без создания tray
- [ ] Добавить try/catch блок с логированием ошибок через `logger.error()`
- [ ] **Validation**: Функция `createTray()` определена
- [ ] **Validation**: При вызове `createTray()` с существующим файлом tray создаётся
- [ ] **Validation**: При отсутствии файла логируется ошибка без краша приложения

---

### Task 1.3: Implement Tray Context Menu

**Duration**: 1 час

**Dependencies**: Task 1.2

- [ ] Реализовать функцию `createTrayMenu(): Menu`:
  - Использовать `Menu.buildFromTemplate([...])`
  - Добавить пункты меню:
    1. **Показать/Скрыть Repetitio**:
       - `label`: определяется динамически (`mainWindow?.isVisible() ? 'Скрыть Repetitio' : 'Показать Repetitio'`)
       - `click`: вызов `toggleWindow()`
    2. **Separator**: `{ type: 'separator' }`
    3. **Закрыть Repetitio**:
       - `label`: `'Закрыть Repetitio'`
       - `click`: вызов `app.quit()`
- [ ] Реализовать функцию `updateTrayMenu()`:
  - Проверить наличие `tray` и `mainWindow`
  - Пересоздать контекстное меню через `tray.setContextMenu(createTrayMenu())`
- [ ] **Validation**: Функции `createTrayMenu()` и `updateTrayMenu()` определены
- [ ] **Validation**: Меню содержит корректные пункты
- [ ] **Validation**: Динамический label обновляется в зависимости от состояния окна

---

### Task 1.4: Implement toggleWindow Function

**Duration**: 30 минут

**Dependencies**: None

- [ ] Реализовать функцию `toggleWindow()`:
  - Проверить наличие `mainWindow` (early return если `null`)
  - Если окно НЕ видимо (`!mainWindow.isVisible()`):
    - Вызвать `mainWindow.show()`
    - Вызвать `mainWindow.focus()`
  - Если окно видимо:
    - Проверить, свёрнуто ли окно (`mainWindow.isMinimized()`)
    - Если свёрнуто: вызвать `mainWindow.restore()`
    - Вызвать `mainWindow.focus()`
- [ ] **Validation**: Функция `toggleWindow()` определена
- [ ] **Validation**: При скрытом окне вызов функции показывает окно
- [ ] **Validation**: При свёрнутом окне вызов функции разворачивает окно
- [ ] **Validation**: При видимом окне вызов фокусирует окно

---

## Phase 2: Window Close Behavior Modification

### Task 2.1: Prevent Window Close Event

**Duration**: 30 минут

**Dependencies**: Task 1.2

- [ ] Найти в `backend/src/electron/main.ts` место регистрации обработчиков событий окна
- [ ] Добавить обработчик события `close` для `mainWindow`:
  - Внутри обработчика вызвать `event.preventDefault()`
  - Вызвать `mainWindow.hide()`
- [ ] **Validation**: Обработчик события `close` зарегистрирован
- [ ] **Validation**: При закрытии окна через крестик окно скрывается, а не завершается процесс
- [ ] **Validation**: Процесс Electron продолжает работать после закрытия окна

---

### Task 2.2: Update IPC window-close Handler

**Duration**: 15 минут

**Dependencies**: Task 2.1

- [ ] Найти функцию `registerIpcHandlers()` в `backend/src/electron/main.ts`
- [ ] Обновить обработчик IPC `window-close`:
  - **Было**: `win?.close()`
  - **Стало**: `if (win) { win.hide(); }`
- [ ] **Validation**: IPC handler `window-close` обновлён
- [ ] **Validation**: При вызове IPC `window-close` из фронтенда окно скрывается

---

### Task 2.3: Update window-all-closed Handler

**Duration**: 15 минут

**Dependencies**: Task 2.1

- [ ] Найти обработчик `app.on('window-all-closed', ...)` в `backend/src/electron/main.ts`
- [ ] Обновить логику:
  - **Было**: `if (process.platform !== 'darwin') { app.quit(); }`
  - **Стало**: удалить вызов `app.quit()` для Windows/Linux (оставить только на macOS)
- [ ] Код должен выглядеть так:
  ```typescript
  app.on("window-all-closed", () => {
    if (process.platform === "darwin") {
      app.quit();
    }
    // На других платформах приложение продолжает работать
  });
  ```
- [ ] **Validation**: На Windows/Linux приложение НЕ завершается при закрытии всех окон
- [ ] **Validation**: На macOS приложение завершается (стандартное поведение)

---

## Phase 3: Tray Integration

### Task 3.1: Call createTray on App Ready

**Duration**: 15 минут

**Dependencies**: Task 1.2

- [ ] Найти обработчик `app.on('ready', ...)` в `backend/src/electron/main.ts`
- [ ] Добавить вызов `createTray()` после `createWindow()`
- [ ] **Validation**: `createTray()` вызывается при запуске приложения
- [ ] **Validation**: Tray иконка появляется в системном трее при запуске

---

### Task 3.2: Implement Tray Cleanup on Quit

**Duration**: 15 минут

**Dependencies**: Task 1.2

- [ ] Добавить обработчик `app.on('before-quit', ...)` в `backend/src/electron/main.ts`:
  - Проверить наличие `tray`
  - Если существует:
    - Вызвать `tray.destroy()`
    - Установить `tray = null`
- [ ] **Validation**: Обработчик `before-quit` зарегистрирован
- [ ] **Validation**: При полном завершении приложения tray удаляется
- [ ] **Validation**: Иконка исчезает из системного трея после quit

---

### Task 3.3: Update Tray Menu on Window State Change

**Duration**: 30 минут

**Dependencies**: Task 1.3, Task 1.4

- [ ] Подписаться на события окна в функции `createWindow()`:
  - `mainWindow.on('show', updateTrayMenu)`
  - `mainWindow.on('hide', updateTrayMenu)`
- [ ] **Validation**: Обработчики зарегистрированы
- [ ] **Validation**: При показе окна label меню меняется на "Скрыть Repetitio"
- [ ] **Validation**: При скрытии окна label меняется на "Показать Repetitio"

---

## Phase 4: Testing & Validation

### Task 4.1: Manual Functional Testing

**Duration**: 1.5 часа

**Dependencies**: Task 3.3

- [ ] Провести ручное тестирование всех сценариев:
  1. **Tray Creation**: запустить приложение → проверить наличие иконки в трее
  2. **Tooltip**: навести курсор на иконку → проверить tooltip "Repetitio"
  3. **Window Close**: нажать крестик → проверить, что окно скрылось (процесс работает)
  4. **Tray Click**: кликнуть на tray → проверить, что окно показалось
  5. **Context Menu**: правый клик (Windows/Linux) → проверить структуру меню
  6. **Show/Hide Label**: проверить динамическое обновление первого пункта меню
  7. **Toggle via Menu**: использовать пункт "Показать/Скрыть" → проверить работу
  8. **Quit via Menu**: использовать пункт "Закрыть Repetitio" → проверить полное завершение
  9. **Minimize Restore**: свернуть окно → кликнуть на tray → проверить восстановление
  10. **Tray Cleanup**: завершить приложение → проверить исчезновение иконки из трея
- [ ] **Validation**: Все сценарии работают корректно
- [ ] **Validation**: Tray поведение соответствует ожиданиям UX
- [ ] **Validation**: Нет краш-багов или memory leaks

---

### Task 4.2: Cross-Platform Testing (Optional)

**Duration**: 1 час

**Dependencies**: Task 4.1

- [ ] **Windows**: проверить tray в правом нижнем углу taskbar
- [ ] **macOS** (если доступна): проверить иконку в menu bar сверху
- [ ] **Linux** (опционально): проверить совместимость с GNOME/KDE
- [ ] **Validation**: Tray работает на всех доступных платформах
- [ ] **Validation**: Платформенные различия корректно обработаны

---

## Phase 5: Documentation & Cleanup

### Task 5.1: Update Walkthrough Documentation

**Duration**: 30 минут

**Dependencies**: Task 4.1

- [ ] Обновить `docs/Walkthrough.md`:
  - Добавить секцию "System Tray Integration"
  - Описать поведение кнопки закрытия окна (скрытие вместо завершения)
  - Объяснить, как полностью завершить приложение (через tray меню)
  - Документировать структуру tray контекстного меню
- [ ] **Validation**: Документация актуальна и понятна
- [ ] **Validation**: Описаны все ключевые сценарии

---

### Task 5.2: Update Changelog

**Duration**: 15 минут

**Dependencies**: Task 5.1

- [ ] Обновить `docs/Changelog.md`:
  - Добавить запись о интеграции с системным треем
  - Указать изменение поведения кнопки закрытия окна
  - Перечислить функции tray меню
- [ ] **Validation**: Changelog содержит полное описание изменений

---

### Task 5.3: Code Quality Check

**Duration**: 30 минут

**Dependencies**: Task 5.2

- [ ] Выполнить `npm run lint` в workspace `backend`
- [ ] Исправить все linting ошибки (если есть)
- [ ] Выполнить `npm run format` (если настроено)
- [ ] Проверить отсутствие TODO/FIXME комментариев
- [ ] Убедиться в соответствии code style правилам проекта
- [ ] **Validation**: `npm run lint` проходит без ошибок
- [ ] **Validation**: Код отформатирован согласно Prettier
- [ ] **Validation**: Нет временных комментариев или debug логов

---

## Summary

**Total Estimated Duration**: ~8 часов

**Parallelization Opportunities**:

- Task 1.4 (toggleWindow) может выполняться параллельно с Task 1.2-1.3
- Task 4.2 (Cross-Platform Testing) опционален и может быть пропущен для MVP

**Critical Path**:

1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 3.1 → 3.2 → 3.3 → 4.1 → 5.1 → 5.2 → 5.3

**Success Criteria**:

- ✅ Tray иконка видима в системном трее
- ✅ Кнопка закрытия окна скрывает окно (не завершает процесс)
- ✅ Клик по tray переключает видимость окна
- ✅ Контекстное меню tray функционирует корректно
- ✅ Пункт меню "Закрыть Repetitio" полностью завершает приложение
- ✅ Tray корректно удаляется при quit
- ✅ Все тесты пройдены
- ✅ Документация актуализирована
