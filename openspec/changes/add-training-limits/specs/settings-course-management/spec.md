# Spec Delta: Settings Course Management — Training Limits Extension

## ADDED Requirements

### Requirement: Course Settings SHALL Include Per-Course Training Limits

**Priority:** MUST  
**Rationale:** Разные курсы могут требовать разной нагрузки

#### Scenario: Course Limits Stored in Database

**GIVEN** пользователь создал курс  
**WHEN** настройки курса сохраняются  
**THEN** таблица `courseSettings` ДОЛЖНА поддерживать поля:

- `newCardsPerDay: integer | null` — лимит новых карточек в день
- `maxReviewsPerDay: integer | null` — лимит повторений в день
- `newCardsPerSession: integer | null` — новых карточек за сессию
- `maxReviewsPerSession: integer | null` — повторений за сессию

#### Scenario: Null Values Inherit From Global Settings

**GIVEN** курсовая настройка `newCardsPerDay = NULL`  
**AND** глобальная настройка `globalNewCardsPerDay = 30`  
**WHEN** система вычисляет эффективные настройки курса  
**THEN** эффективное значение `newCardsPerDay` ДОЛЖНО быть 30 (унаследовано)

#### Scenario: Explicit Course Limit Overrides Global

**GIVEN** курсовая настройка `newCardsPerDay = 10`  
**AND** глобальная настройка `globalNewCardsPerDay = 30`  
**WHEN** система вычисляет эффективные настройки  
**THEN** эффективное значение ДОЛЖНО быть 10 (курсовое имеет приоритет)

---

### Requirement: Course Settings API SHALL Return Limit Fields

**Priority:** MUST  
**Rationale:** Frontend должен получать и отправлять лимиты

#### Scenario: Get Course Settings Includes Limits

**GIVEN** курс имеет индивидуальные настройки  
**WHEN** клиент запрашивает `GET /api/courses/:id/settings`  
**THEN** ответ ДОЛЖЕН включать:

```json
{
  "newCardsPerDay": 15,
  "maxReviewsPerDay": 100,
  "newCardsPerSession": 10,
  "maxReviewsPerSession": 50
}
```

**OR** если настройки не установлены (наследуются):

```json
{
  "newCardsPerDay": null,
  "maxReviewsPerDay": null,
  "newCardsPerSession": null,
  "maxReviewsPerSession": null
}
```

#### Scenario: Update Course Limits

**GIVEN** пользователь изменяет лимиты курса  
**WHEN** клиент отправляет `PUT /api/courses/:id/settings` с телом:

```json
{
  "newCardsPerDay": 20,
  "maxReviewsPerSession": 30
}
```

**THEN** API ДОЛЖЕН сохранить указанные значения  
**AND** другие поля (не указанные) ДОЛЖНЫ остаться без изменений

---

### Requirement: Course Settings UI SHALL Display Limit Controls with Inheritance Hints

**Priority:** MUST  
**Rationale:** Пользователь должен понимать, какие значения унаследованы

#### Scenario: Course Settings Modal Shows Limit Sections

**GIVEN** пользователь открывает модальное окно настроек курса  
**WHEN** окно отображается  
**THEN** ДОЛЖНЫ присутствовать два раздела:

**Раздел "Дневные лимиты":**

- Number input "Новых карточек в день"
    - Placeholder: "Наследуется (глобально: 20)"
    - Hint: "Оставьте пустым для использования глобального значения"
- Number input "Повторений в день"
    - Placeholder: "Наследуется (глобально: 200)"

**Раздел "Сессионные лимиты":**

- Number input "Новых карточек за сессию" — default 10
- Number input "Повторений за сессию" — default 50

#### Scenario: Clear Course Limit to Inherit

**GIVEN** курс имеет `newCardsPerDay = 15`  
**AND** пользователь очищает поле (устанавливает в пустое значение)  
**WHEN** пользователь сохраняет настройки  
**THEN** API ДОЛЖЕН сохранить `newCardsPerDay = null`  
**AND** курс ДОЛЖЕН начать использовать глобальное значение

---

### Requirement: Validation SHALL Enforce Reasonable Limit Ranges

**Priority:** MUST  
**Rationale:** Предотвращение некорректных значений

#### Scenario: Reject Negative Limits

**GIVEN** пользователь пытается установить `newCardsPerSession = -5`  
**WHEN** форма отправляет данные на API  
**THEN** API ДОЛЖЕН вернуть 400 Bad Request  
**AND** сообщение об ошибке ДОЛЖНО указывать на недопустимое значение

#### Scenario: Accept Zero Limits

**GIVEN** пользователь устанавливает `newCardsPerDay = 0`  
**WHEN** настройки сохраняются  
**THEN** API ДОЛЖЕН принять значение  
**AND** курс НЕ ДОЛЖЕН показывать новые карточки (блокировка)

#### Scenario: Warn on Extreme Values

**GIVEN** пользователь устанавливает `maxReviewsPerDay = 1000`  
**WHEN** форма валидирует значение  
**THEN** UI МОЖЕТ показать предупреждение "Это очень большое значение"  
**BUT** ДОЛЖЕН разрешить сохранение (не блокировать)

---

## MODIFIED Requirements

(Нет изменений существующих требований — только дополнения)

---

## Default Values

| Поле                   | Default        | Диапазон | Nullable |
|------------------------|----------------|----------|----------|
| `newCardsPerDay`       | null (inherit) | 0-500    | Yes      |
| `maxReviewsPerDay`     | null (inherit) | 0-1000   | Yes      |
| `newCardsPerSession`   | 10             | 0-200    | Yes      |
| `maxReviewsPerSession` | 50             | 0-500    | Yes      |

## Implementation Notes

- Добавить 4 nullable поля в `courseSettings` таблицу
- Обновить `getEffectiveSettings()` для поддержки наследования
- Расширить UI `CourseSettingsModal.vue` двумя новыми разделами
- Показывать глобальные значения в placeholder'ах
