# Proposal: replace-time-selects

## Problem Statement

Текущий `TimeRangePicker` компонент использует стандартные HTML `<select>` элементы для выбора времени начала и конца дня тренировок. Это решение имеет следующие недостатки:

1. **Плохой UX на мобильных устройствах** — нативные select'ы не предоставляют плавного touch-based взаимодействия
2. **Ограниченная кастомизация** — невозможно полностью адаптировать внешний вид под дизайн-систему приложения
3. **Низкое качество взаимодействия** — стандартные dropdown'ы не соответствуют premium-уровню UI, который требуется для приложения
4. **Несоответствие мобильным паттернам** — iOS/Android используют scroll picker'ы, а не dropdown'ы для выбора времени

## Why

### User Experience Enhancement

Текущие HTML `<select>` элементы создают устаревший и неинтуитивный опыт взаимодействия. Пользователи привыкли к scroll picker'ам на мобильных устройствах (iOS, Android), и применение этого паттерна в desktop приложении обеспечит:

1. **Консистентный UX** — одинаковый паттерн взаимодействия независимо от платформы
2. **Визуальный контекст** — возможность видеть соседние значения времени (hour-1, hour, hour+1)
3. **Плавные анимации** — современный, fluid UI вместо резких dropdown переходов

### Design System Alignment

Стандартные `<select>` элементы не поддаются полной кастомизации:
- Невозможно применить custom scrollbar styles во всех браузерах
- Dropdown menu имеет разный вид в Chrome, Firefox, Safari
- Нельзя полностью контролировать цвета, размеры, transitions

Scroll picker позволяет создать компонент, полностью соответствующий дизайн-системе приложения с использованием CSS variables и темизации.

### Future-Proofing

Приложение потенциально может быть портировано на:
- **Tablet/Hybrid devices** — Windows планшеты и 2-in-1 устройства требуют touch-friendly интерфейсов
- **Mobile version** — возможная PWA или mobile wrapper версия приложения

Scroll picker обеспечивает готовность к этим сценариям без необходимости дальнейшего рефакторинга.

### Competitive Parity

Анализ конкурентных приложений (Anki, RemNote, Obsidian) показывает тренд на использование custom UI компонентов вместо нативных HTML элементов для premium UX.

## Proposed Solution

Заменить стандартные HTML `<select>` элементы на компонент `vue-scroll-picker` (https://www.npmjs.com/package/vue-scroll-picker), который предоставляет:

- Touch-friendly scroll-based интерфейс для выбора времени
- Полную кастомизацию внешнего вида через CSS
- Плавные анимации и transition'ы
- Нативный для мобильных устройств паттерн взаимодействия
- Совместимость с Vue 3 Composition API

### Implementation Approach

1. **Добавить зависимость** `vue-scroll-picker` в `frontend/package.json`
2. **Создать универсальную обёртку** `ScrollTimePicker.vue` в `shared/ui/`
   - Поддержка часов (0-23) и минут (0-59 с опциональным шагом)
   - Настраиваемые props: min, max, step, suffix
3. **Обновить** `TimeRangePicker.vue` для использования **4 scroll picker'ов**:
   - Start Hours + Start Minutes
   - End Hours + End Minutes
4. **Изменить формат данных**: время в **минутах с начала дня** (0-1439)
   - Frontend: конвертация hours+minutes ↔ total minutes
   - Backend: изменить поля `trainingStartHour`/`trainingEndHour` на `trainingStartTime`/`trainingEndTime` (minutes)
5. **Применить** стилизацию согласно текущей дизайн-системе (CSS variables)

### User Value

- **Точность выбора времени** — пользователь может установить время с точностью до минут (15-минутный шаг)
- **Улучшенный UX** — более интуитивный и приятный интерфейс выбора времени
- **Гибкость настроек** — возможность точнее настроить временные рамки тренировок
- **Консистентность** — единый паттерн взаимодействия на desktop и mobile
- **Премиум-качество** — современный UI соответствует высоким стандартам приложения

## Scope

### In Scope

- Добавление `vue-scroll-picker` как зависимости
- Создание универсального `ScrollTimePicker.vue` wrapper компонента (hours + minutes)
- Рефакторинг `TimeRangePicker.vue` для использования **4 scroll picker'ов** (hours+minutes x2)
- **Изменение формата данных**: переход с часов на минуты (0-1439)
- **Backend изменения**:
  - Миграция БД: `trainingStartHour`/`trainingEndHour` → `trainingStartTime`/`trainingEndTime`
  - Обновление Zod schemas для validation минут (0-1439)
  - Обновление API endpoints (settings, course settings)
- Frontend изменения:
  - Конвертация данных в `SettingsForm.vue` (minutes ↔ hours+minutes)
  - Обновление validation logic для времени в минутах
  - Update timeline visualization для работы с минутами
- Стилизация компонентов согласно дизайн-системе (light/dark themes)

### Out of Scope

- Изменение логики расчёта интервалов FSRS
- Изменение `minTimeBeforeEnd` (остаётся в часах)
- Добавление новых настроек (кроме точности времени)
- Миграция существующих данных (пользователи должны пересохранить настройки)
- Поддержка 24-hour wrap-around (end time < start time)

## Dependencies

### Internal

- `settings-ui` spec — компонент используется в SettingsForm
- `styling-system` spec — требуется использовать существующие CSS variables

### External

- `vue-scroll-picker` package (будет добавлен в `package.json`)
- Vue 3 Composition API (уже используется)
- TailwindCSS v4 (уже используется)

## Risks & Mitigations

### Risk 1: Библиотека не совместима с Vue 3

**Вероятность:** низкая (пакет заявлен как Vue 3 совместимый)

**Mitigation:** Протестировать интеграцию на первом этапе. Если обнаружатся проблемы — рассмотреть альтернативные библиотеки или создать собственный scroll picker.

### Risk 2: Производительность при рендере 24 часов

**Вероятность:** средняя (scroll picker может быть ресурсоёмким)

**Mitigation:** Использовать виртуализацию списка (если библиотека поддерживает) или ограничить количество видимых элементов одновременно.

### Risk 3: Несоответствие дизайн-системе

**Вероятность:** средняя (требуется кастомная стилизация)

**Mitigation:** Создать wrapper компонент с полной стилизацией через CSS variables. При необходимости использовать scoped styles для переопределения библиотечных стилей.

## Success Criteria

1. `vue-scroll-picker` успешно интегрирован в проект
2. `TimeRangePicker` использует scroll picker'ы вместо `<select>`
3. Все существующие тесты (ручные) проходят без изменений
4. Компонент корректно работает в light/dark темах
5. API компонента (props/events) остаётся неизменным
6. Визуализация timeline сохранена и корректно обновляется
7. Нет регрессий в `SettingsPage` и `CourseSettingsModal`

## Timeline Estimate

**Small** (1-2 часа работы)

- Добавление зависимости: 5 минут
- Создание `ScrollTimePicker.vue`: 30 минут
- Рефакторинг `TimeRangePicker.vue`: 30 минут
- Стилизация и тестирование: 30 минут
- Валидация в темах и модалах: 15 минут
