# settings-retention Specification

## Purpose

TBD - created by archiving change add-retention-settings. Update Purpose after archive.

## Requirements

### Requirement: Global Settings SHALL Include Request Retention Parameter

**Priority:** MUST  
**Rationale:** Пользователи должны иметь возможность выбирать интенсивность обучения (желаемую надежность памяти) в соответствии со своими целями.

#### Scenario: Request Retention Stored in Database

**GIVEN** база данных проинициализирована  
**WHEN** создаются глобальные настройки  
**THEN** таблица `settings` ДОЛЖНА содержать поле:

- `requestRetention: real` — значение от 0.70 до 1.00, default 0.90

#### Scenario: Request Retention Accessible via API

**GIVEN** пользователь запрашивает глобальные настройки  
**WHEN** API обрабатывает запрос `GET /api/settings`  
**THEN** ответ ДОЛЖЕН включать:

```json
{
  "requestRetention": 0.9
}
```

#### Scenario: Request Retention Validation

**GIVEN** пользователь сохраняет глобальные настройки  
**WHEN** значение `requestRetention` установлено вне диапазона [0.70, 1.00]  
**THEN** API ДОЛЖЕН вернуть ошибку валидации 400  
**AND** сообщение ДОЛЖНО указывать на недопустимый диапазон

**WHEN** значение находится в диапазоне [0.70, 1.00]  
**THEN** API ДОЛЖЕН принять значение

---

### Requirement: Course Settings SHALL Include Request Retention Parameter with Inheritance

**Priority:** MUST  
**Rationale:** Разные курсы могут требовать разной интенсивности обучения

#### Scenario: Course Request Retention Stored in Database

**GIVEN** пользователь создал курс  
**WHEN** настройки курса сохраняются  
**THEN** таблица `courseSettings` ДОЛЖНА поддерживать поле:

- `requestRetention: real | null` — значение от 0.70 до 1.00 или null (наследование)

#### Scenario: Null Value Inherits From Global Settings

**GIVEN** курсовая настройка `requestRetention = NULL`  
**AND** глобальная настройка `requestRetention = 0.90`  
**WHEN** система вычисляет эффективные настройки курса  
**THEN** эффективное значение `requestRetention` ДОЛЖНО быть 0.90 (унаследовано)

#### Scenario: Explicit Course Retention Overrides Global

**GIVEN** курсовая настройка `requestRetention = 0.80`  
**AND** глобальная настройка `requestRetention = 0.90`  
**WHEN** система вычисляет эффективные настройки  
**THEN** эффективное значение ДОЛЖНО быть 0.80 (курсовое имеет приоритет)

---

### Requirement: FSRS Service SHALL Use Configurable Request Retention

**Priority:** MUST  
**Rationale:** Жёстко зашитое значение 0.9 должно быть заменено на настраиваемое

#### Scenario: FSRS Uses Global Retention for Courses Without Custom Settings

**GIVEN** курс не имеет индивидуальной настройки `requestRetention`  
**AND** глобальная настройка `requestRetention = 0.95`  
**WHEN** FSRS рассчитывает интервалы для карточек курса  
**THEN** алгоритм ДОЛЖЕН использовать значение 0.95

#### Scenario: FSRS Uses Course-Specific Retention

**GIVEN** курс имеет индивидуальную настройку `requestRetention = 0.80`  
**WHEN** FSRS рассчитывает интервалы для карточек курса  
**THEN** алгоритм ДОЛЖЕН использовать значение 0.80 (игнорируя глобальное)

#### Scenario: Default Retention Value for Existing Data

**GIVEN** в БД уже существуют курсы без значения `requestRetention`  
**WHEN** выполняется миграция  
**THEN** все существующие записи ДОЛЖНЫ получить значение `requestRetention = 0.90`  
**AND** новое поведение ДОЛЖНО быть идентично старому

---

### Requirement: Settings UI SHALL Expose Retention Level Picker

**Priority:** MUST  
**Rationale:** Пользователь должен легко выбирать уровень интенсивности без понимания FSRS

#### Scenario: Global Settings Display Retention Level Picker

**GIVEN** пользователь открывает страницу глобальных настроек  
**WHEN** страница отображается  
**THEN** ДОЛЖЕН присутствовать раздел "Интенсивность обучения"  
**AND** раздел ДОЛЖЕН содержать три radio кнопки:

- **Low (Расслабленный режим)** — 0.80
- **Medium (Стандарт)** — 0.90
- **High (Cramming)** — 0.95

**AND** ДОЛЖЕН быть выбран текущий уровень (по умолчанию Medium)

#### Scenario: Course Settings Display Retention Level Picker with Inheritance Option

**GIVEN** пользователь открывает модальное окно настроек курса  
**WHEN** окно отображается  
**THEN** ДОЛЖЕН присутствовать раздел "Интенсивность обучения"  
**AND** раздел ДОЛЖЕН содержать четыре опции:

- **Inherited (Наследуется)** — использовать глобальное значение
- **Low (Расслабленный режим)** — 0.80
- **Medium (Стандарт)** — 0.90
- **High (Cramming)** — 0.95

**AND** плейсхолдер ДОЛЖЕН показывать "Наследуется (глобально: Medium)"

#### Scenario: Retention Level Tooltips

**GIVEN** пользователь наводит курсор на опцию в Retention Level Picker  
**WHEN** срабатывает hover  
**THEN** ДОЛЖЕН отобразиться tooltip с объяснением:

- **Low:** "Меньше повторений, больше забывается. Подходит для долгосрочного изучения"
- **Medium:** "Сбалансированный режим. Подходит для большинства курсов"
- **High:** "Много повторений, почти не забывается. Подходит для экзаменов и cramming"
