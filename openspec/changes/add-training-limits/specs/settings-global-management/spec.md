# Spec Delta: Settings Global Management — Training Limits Extension

## ADDED Requirements

### Requirement: Global Settings SHALL Include Daily Training Limits

**Priority:** MUST  
**Rationale:** Глобальные лимиты предотвращают перегрузку при изучении нескольких курсов

#### Scenario: Global Limits Stored in Database

**GIVEN** база данных инициализирована  
**WHEN** создаются глобальные настройки  
**THEN** таблица `settings` ДОЛЖНА содержать поля:

- `globalNewCardsPerDay: integer` — default 20
- `globalMaxReviewsPerDay: integer` — default 200

#### Scenario: Global Limits Accessible via API

**GIVEN** пользователь запрашивает глобальные настройки  
**WHEN** API обрабатывает запрос `GET /api/settings`  
**THEN** ответ ДОЛЖЕН включать:

```json
{
  "globalNewCardsPerDay": 20,
  "globalMaxReviewsPerDay": 200
}
```

#### Scenario: Global Limits Validation

**GIVEN** пользователь сохраняет глобальные настройки  
**WHEN** значение `globalNewCardsPerDay` установлено в отрицательное число  
**THEN** API ДОЛЖЕН вернуть ошибку валидации 400  
**AND** сообщение ДОЛЖНО указывать на недопустимое значение

**WHEN** значение находится в диапазоне 0-1000  
**THEN** API ДОЛЖЕН принять значение

---

### Requirement: Settings UI SHALL Expose Global Limit Controls

**Priority:** MUST  
**Rationale:** Пользователь должен видеть и изменять глобальные лимиты

#### Scenario: Global Limits Section in Settings Page

**GIVEN** пользователь открывает страницу настроек  
**WHEN** страница отображается  
**THEN** ДОЛЖЕН присутствовать раздел "Дневные лимиты (по всем курсам)"  
**AND** раздел ДОЛЖЕН содержать:

- Number input "Новых карточек в день" с текущим значением
- Number input "Повторений в день" с текущим значением
- Подсказка: "Эти лимиты применяются ко всем курсам суммарно"

#### Scenario: Save Global Limits

**GIVEN** пользователь изменил `globalNewCardsPerDay` с 20 на 30  
**WHEN** пользователь нажимает "Сохранить"  
**THEN** форма ДОЛЖНА отправить PUT запрос на `/api/settings`  
**AND** после успешного сохранения ДОЛЖНО показаться уведомление "Настройки сохранены"  
**AND** новое значение ДОЛЖНО применяться немедленно

---

## MODIFIED Requirements

(Нет изменений существующих требований — только дополнения)

---

## Implementation Notes

- Добавить два поля в таблицу `settings` через миграцию
- Обновить Zod схему валидации для включения новых полей
- Расширить UI компонент `SettingsForm.vue` новым разделом
- Default значения: 20 новых/день, 200 повторений/день
