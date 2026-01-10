# tray-integration Specification

## Purpose

Определяет поведение приложения при интеграции с системным треем (System Tray / Menu Bar), включая скрытие окна вместо закрытия, управление через tray иконку и контекстное меню для полного завершения приложения.

## ADDED Requirements

### Requirement: Tray Icon Display

The system SHALL create and display a tray icon when the application starts.

**Rationale**: Tray иконка обеспечивает постоянный визуальный индикатор работающего приложения и предоставляет точку доступа для быстрого управления видимостью окна.

#### Scenario: Tray Icon Created on Application Start

- **GIVEN** приложение запускается (Electron `app.on('ready')` executed)
- **WHEN** выполняется функция `createTray()`
- **THEN**:
  - В системном трее появляется иконка приложения (загруженная из `icon-tray.png`)
  - Иконка видима в системном трее (Windows: правый нижний угол taskbar, macOS: menu bar сверху)
  - При наведении на иконку отображается tooltip "Repetitio"
- **AND** иконка остаётся видимой, пока приложение работает

#### Scenario: Tray Icon Tooltip

- **GIVEN** приложение запущено и tray иконка создана
- **WHEN** пользователь наводит курсор на иконку трея
- **THEN** отображается tooltip с текстом "Repetitio"

---

### Requirement: Window Hide Instead of Close

The system SHALL hide the main window instead of quitting the application when the user attempts to close it.

**Rationale**: Полное завершение приложения при закрытии окна требует повторной инициализации при следующем запуске. Скрытие окна позволяет мгновенно вернуться к работе и соответствует стандартному UX desktop-приложений для продуктивности.

#### Scenario: Close Button Hides Window

- **GIVEN** главное окно приложения видимо
- **WHEN** пользователь нажимает кнопку закрытия окна (крестик в title bar)
- **THEN**:
  - Событие `close` перехватывается (`event.preventDefault()`)
  - Окно скрывается (`mainWindow.hide()`)
  - Процесс Electron НЕ завершается
  - Tray иконка остаётся видимой в системном трее
- **AND** окно больше не отображается в списке задач (taskbar/Dock)

#### Scenario: IPC window-close Handler Hides Window

- **GIVEN** главное окно видимо
- **WHEN** фронтенд отправляет IPC сообщение `window-close` (через кнопку в `TitleBar.vue`)
- **THEN**:
  - Окно скрывается (`mainWindow.hide()`)
  - Процесс НЕ завершается
  - Tray иконка остаётся видимой

#### Scenario: Hidden Window State Persists

- **GIVEN** окно скрыто через закрытие
- **WHEN** пользователь проверяет запущенные процессы (Task Manager / Activity Monitor)
- **THEN**: процесс `Repetitio.exe` (или `Electron`) продолжает работать в фоне

---

### Requirement: Tray Icon Click Toggles Window Visibility

The system SHALL toggle window visibility when the user clicks on the tray icon.

**Rationale**: Клик по tray иконке является основным способом быстрого доступа к приложению без необходимости полного перезапуска.

#### Scenario: Show Hidden Window

- **GIVEN** главное окно скрыто (`mainWindow.isVisible() === false`)
- **WHEN** пользователь кликает левой кнопкой мыши на tray иконку
- **THEN**:
  - Окно показывается (`mainWindow.show()`)
  - Окно получает фокус (`mainWindow.focus()`)
  - Окно восстанавливает прежний размер и позицию
- **AND** окно появляется в списке задач (taskbar/Dock)

#### Scenario: Hide Visible Window

- **GIVEN** главное окно видимо (`mainWindow.isVisible() === true`)
- **WHEN** пользователь кликает левой кнопкой мыши на tray иконку
- **THEN**:
  - Окно скрывается (`mainWindow.hide()`)
  - Окно исчезает из списка задач

#### Scenario: Restore Minimized Window

- **GIVEN** главное окно свёрнуто (`mainWindow.isMinimized() === true`), но всё ещё видимо
- **WHEN** пользователь кликает левой кнопкой мыши на tray иконку
- **THEN**:
  - Окно разворачивается (`mainWindow.restore()`)
  - Окно получает фокус (`mainWindow.focus()`)

---

### Requirement: Tray Context Menu

The system SHALL provide a context menu when the user right-clicks (Windows/Linux) or clicks (macOS) on the tray icon.

**Rationale**: Контекстное меню предоставляет дополнительные опции управления приложением, включая полное завершение процесса.

#### Scenario: Context Menu Structure

- **GIVEN** приложение запущено и tray иконка создана
- **WHEN** пользователь вызывает контекстное меню трея (правый клик на Windows/Linux, левый клик на macOS)
- **THEN** отображается меню со следующими пунктами:
  1. **"Показать Repetitio"** или **"Скрыть Repetitio"** (зависит от текущего состояния окна)
  2. **Разделитель** (separator)
  3. **"Закрыть Repetitio"**

#### Scenario: Show/Hide Menu Item Label Updates

- **GIVEN** главное окно видимо
- **WHEN** пользователь открывает контекстное меню трея
- **THEN** первый пункт меню имеет текст **"Скрыть Repetitio"**
- **WHEN** окно скрыто
- **AND** пользователь открывает контекстное меню трея
- **THEN** первый пункт меню имеет текст **"Показать Repetitio"**

#### Scenario: Show/Hide Menu Item Click

- **GIVEN** контекстное меню трея открыто
- **WHEN** пользователь кликает на пункт "Показать Repetitio" (если окно скрыто)
- **THEN**: окно показывается и получает фокус
- **WHEN** пользователь кликает на пункт "Скрыть Repetitio" (если окно видимо)
- **THEN**: окно скрывается

---

### Requirement: Application Quit via Tray Menu

The system SHALL provide a way to completely quit the application through the tray context menu.

**Rationale**: Пользователю необходим явный способ полного завершения приложения, так как кнопка закрытия окна теперь только скрывает его.

#### Scenario: Quit Application from Tray Menu

- **GIVEN** приложение запущено (окно может быть видимо или скрыто)
- **WHEN** пользователь открывает контекстное меню трея
- **AND** кликает на пункт "Закрыть Repetitio"
- **THEN**:
  - Вызывается `app.quit()`
  - Все окна закрываются
  - Tray иконка удаляется (`tray.destroy()`)
  - Процесс Electron полностью завершается
- **AND** приложение больше не отображается в списке запущенных процессов

#### Scenario: Tray Cleanup on Quit

- **GIVEN** приложение завершается через `app.quit()`
- **WHEN** обрабатывается событие `app.on('before-quit')`
- **THEN**:
  - Tray иконка удаляется (`tray.destroy()`)
  - Переменная `tray` устанавливается в `null`
- **AND** иконка исчезает из системного трея

---

### Requirement: Application Continues Running with Hidden Window

The system SHALL keep the Electron process running when all windows are hidden.

**Rationale**: Чтобы пользователь мог быстро вернуться к приложению через tray, процесс не должен завершаться при скрытии окна.

#### Scenario: window-all-closed Does Not Quit on Windows/Linux

- **GIVEN** главное окно скрыто через закрытие
- **WHEN** обрабатывается событие `app.on('window-all-closed')`
- **AND** платформа НЕ является macOS (`process.platform !== 'darwin'`)
- **THEN**: приложение НЕ завершается (не вызывается `app.quit()`)
- **AND** процесс Electron продолжает работать в фоне

#### Scenario: macOS Standard Behavior

- **GIVEN** главное окно закрыто на macOS
- **WHEN** обрабатывается событие `app.on('window-all-closed')`
- **AND** платформа является macOS (`process.platform === 'darwin'`)
- **THEN**: приложение завершается (`app.quit()`) — стандартное поведение macOS приложений

---

### Requirement: Tray Icon File Exists

The system SHALL validate that the tray icon file exists before attempting to create the Tray.

**Rationale**: Отсутствие файла иконки приведёт к ошибке при создании Tray, что может нарушить работу приложения.

#### Scenario: Tray Icon File Validation

- **GIVEN** приложение инициализируется и вызывается `createTray()`
- **WHEN** проверяется наличие файла `icon-tray.png` по пути `backend/icon-tray.png`
- **THEN**:
  - Если файл существует → Tray создаётся корректно
  - Если файл НЕ существует:
    - Логируется ошибка: `"Tray icon not found!"`
    - Tray НЕ создаётся
    - Приложение продолжает работать в обычном режиме (fallback: кнопка закрытия полностью завершает приложение)

#### Scenario: Graceful Degradation on Tray Creation Failure

- **GIVEN** создание Tray завершилось ошибкой (файл не найден или другая ошибка)
- **WHEN** пользователь нажимает кнопку закрытия окна
- **THEN**:
  - Окно закрывается полностью (`app.quit()`)
  - Приложение завершается
- **AND** логируется предупреждение о работе без tray

---
