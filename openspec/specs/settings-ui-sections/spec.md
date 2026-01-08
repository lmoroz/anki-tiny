# settings-ui-sections Specification

## Purpose

TBD - created by archiving change add-retention-settings. Update Purpose after archive.

## Requirements

### Requirement: SettingsForm SHALL Organize Controls into Collapsible Sections

**Priority:** MUST  
**Rationale:** Текущая форма настроек слишком вертикально растянута и утомляет пользователя

#### Scenario: Global Settings Form Has Collapsible Sections

**GIVEN** пользователь открывает страницу глобальных настроек  
**WHEN** SettingsForm отображается  
**THEN** форма ДОЛЖНА быть организована в следующие секции:

1. **Временные рамки тренировок**
   - TimeRangePicker (trainingStartTime, trainingEndTime)
   - minTimeBeforeEnd
2. **Параметры FSRS**
   - learningSteps
   - enableFuzz
   - **requestRetention** (новый)
3. **Уведомления**
   - notificationsEnabled
4. **Дневные лимиты (по всем курсам)**
   - globalNewCardsPerDay
   - globalMaxReviewsPerDay
5. **Лимиты курсов по умолчанию**
   - defaultNewCardsPerDay
   - defaultMaxReviewsPerDay
   - defaultNewCardsPerSession
   - defaultMaxReviewsPerSession

**AND** каждая секция ДОЛЖНА иметь заголовок и кнопку expand/collapse

#### Scenario: Course Settings Modal Has Collapsible Sections

**GIVEN** пользователь открывает модальное окно настроек курса  
**WHEN** CourseSettingsModal отображается  
**THEN** форма ДОЛЖНА быть организована в следующие секции:

1. **Временные рамки тренировок**
   - TimeRangePicker (trainingStartTime, trainingEndTime)
   - minTimeBeforeEnd
2. **Параметры FSRS**
   - learningSteps
   - enableFuzz
   - **requestRetention** (новый)
3. **Дневные лимиты курса**
   - newCardsPerDay
   - maxReviewsPerDay
4. **Сессионные лимиты**
   - newCardsPerSession
   - maxReviewsPerSession

**AND** каждая секция ДОЛЖНА иметь заголовок и кнопку expand/collapse

---

### Requirement: CollapsibleSection Component SHALL Provide Expand/Collapse Interaction

**Priority:** MUST  
**Rationale:** Базовый UI компонент для реорганизации форм

#### Scenario: Section Is Expanded by Default

**GIVEN** пользователь открывает настройки впервые  
**WHEN** SettingsForm загружается  
**THEN** все секции ДОЛЖНЫ быть развёрнуты (expanded) по умолчанию  
**AND** иконка ДОЛЖНА указывать на состояние (chevron down)

#### Scenario: User Collapses Section

**GIVEN** секция развёрнута  
**WHEN** пользователь кликает на заголовок или иконку  
**THEN** содержимое секции ДОЛЖНО скрыться с плавной анимацией  
**AND** иконка ДОЛЖНА повернуться (chevron right)  
**AND** высота секции ДОЛЖНА уменьшиться до высоты заголовка

#### Scenario: User Expands Section

**GIVEN** секция свёрнута  
**WHEN** пользователь кликает на заголовок или иконку  
**THEN** содержимое секции ДОЛЖНО развернуться с плавной анимацией  
**AND** иконка ДОЛЖНА повернуться (chevron down)  
**AND** высота секции ДОЛЖНА увеличиться для отображения всего контента

---

### Requirement: Section State SHALL Persist Across Sessions

**Priority:** SHALL  
**Rationale:** Пользователь не должен каждый раз вручную сворачивать одни и те же секции

#### Scenario: Collapsed State Saved to localStorage

**GIVEN** пользователь свернул секцию "Дневные лимиты"  
**WHEN** пользователь закрывает страницу настроек  
**THEN** состояние секции (collapsed) ДОЛЖНО быть сохранено в localStorage  
**AND** ключ ДОЛЖЕН быть уникальным для каждой секции (например, `settings-section-limits-collapsed`)

#### Scenario: Collapsed State Restored on Page Load

**GIVEN** пользователь ранее свернул секцию "Дневные лимиты"  
**WHEN** пользователь открывает страницу настроек снова  
**THEN** секция "Дневные лимиты" ДОЛЖНА быть свёрнута автоматически  
**AND** остальные секции ДОЛЖНЫ оставаться развёрнутыми (если не были свёрнуты)

---

### Requirement: Collapsible Sections SHALL Support Keyboard Navigation

**Priority:** SHALL  
**Rationale:** Accessibility для пользователей без мыши

#### Scenario: Tab Navigation Moves Between Section Headers

**GIVEN** пользователь находится на странице настроек  
**WHEN** пользователь нажимает Tab  
**THEN** фокус ДОЛЖЕН перемещаться между заголовками секций и полями внутри развёрнутых секций  
**AND** видимая граница фокуса (outline) ДОЛЖНА быть чёткой

#### Scenario: Enter/Space Toggles Section

**GIVEN** заголовок секции находится в фокусе  
**WHEN** пользователь нажимает Enter или Space  
**THEN** секция ДОЛЖНА переключиться между expanded/collapsed состояниями  
**AND** анимация ДОЛЖНА быть такой же, как при клике мышью
