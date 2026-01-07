<script setup>
  import { ref, computed, watch } from 'vue'

  const props = defineProps({
    modelValue: {
      type: Object,
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    },
    showSaveButton: {
      type: Boolean,
      default: true
    },
    isCourseSettings: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue', 'save'])

  const localSettings = ref({ ...props.modelValue })

  // Helper для конвертации learningSteps из JSON в user-friendly формат
  function parseLearningStepsForDisplay(jsonString) {
    if (!jsonString) return ''
    try {
      const parsed = JSON.parse(jsonString)
      if (Array.isArray(parsed)) return parsed.join(', ')
    } catch {
      // Если это уже строка с запятыми, оставляем как есть
      return jsonString
    }
    return jsonString
  }

  // Helper для конвертации learningSteps из user-friendly в JSON
  function formatLearningStepsForBackend(input) {
    if (!input) return ''
    // Если это уже JSON-массив, возвращаем как есть
    if (input.trim().startsWith('[')) return input
    // Конвертируем строку с числами через запятую в JSON-массив
    const numbers = input
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n > 0)
    return JSON.stringify(numbers)
  }

  // Computed для отображения learningSteps в удобном формате
  const displayLearningSteps = computed({
    get: () => parseLearningStepsForDisplay(localSettings.value.learningSteps),
    set: value => {
      localSettings.value.learningSteps = formatLearningStepsForBackend(value)
    }
  })

  // Helper function to format minutes to HH:MM
  function formatTime(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Validation
  const validation = computed(() => {
    const errors = {}

    if (localSettings.value.trainingStartTime >= localSettings.value.trainingEndTime) {
      errors.timeRange = 'Начало дня должно быть раньше конца'
    }

    const durationMinutes = localSettings.value.trainingEndTime - localSettings.value.trainingStartTime
    const durationHours = durationMinutes / 60
    if (durationHours < localSettings.value.minTimeBeforeEnd) {
      errors.minTime = 'Диапазон тренировок слишком короткий для указанного минимального времени'
    }

    if (localSettings.value.minTimeBeforeEnd < 1 || localSettings.value.minTimeBeforeEnd > 12) {
      errors.minTimeValue = 'Минимальное время должно быть от 1 до 12 часов'
    }

    // Validate learningSteps
    if (localSettings.value.learningSteps) {
      try {
        const parsed = JSON.parse(localSettings.value.learningSteps)
        if (!Array.isArray(parsed) || !parsed.every(n => typeof n === 'number' && n > 0)) {
          errors.learningSteps = 'Шаги обучения должны быть положительными числами'
        }
      } catch {
        errors.learningSteps = 'Неверный формат (используйте числа через запятую)'
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  })

  // Синхронизация с parent
  watch(
    localSettings,
    newVal => {
      emit('update:modelValue', newVal)
    },
    { deep: true }
  )

  watch(
    () => props.modelValue,
    newVal => {
      localSettings.value = { ...newVal }
    },
    { deep: true }
  )

  function handleSave() {
    console.log('SettingsForm handleSave', localSettings.value)
    if (validation.value.isValid) emit('save', localSettings.value)
  }
</script>

<template>
  <div class="settings-form flex flex-col gap-[24px]">
    <!-- Временной диапазон -->
    <div class="form-section flex flex-col gap-[8px]">
      <h3>Временные рамки тренировок</h3>
      <TimeRangePicker
        v-model:start="localSettings.trainingStartTime"
        v-model:end="localSettings.trainingEndTime"
        :disabled="readonly" />
      <p
        v-if="validation.errors.timeRange"
        class="error-message">
        {{ validation.errors.timeRange }}
      </p>
    </div>

    <!-- Минимальное время до конца дня -->
    <div class="form-section flex flex-col gap-[8px]">
      <label>Минимальное время до конца дня (часов)</label>
      <Input
        v-model.number="localSettings.minTimeBeforeEnd"
        type="number"
        min="1"
        max="12"
        :disabled="readonly" />
      <p class="help-text">Новые карточки не будут показываться, если до конца дня осталось меньше указанного времени</p>
      <p
        v-if="validation.errors.minTime || validation.errors.minTimeValue"
        class="error-message">
        {{ validation.errors.minTime || validation.errors.minTimeValue }}
      </p>
    </div>

    <!-- Уведомления -->
    <div class="form-section flex flex-col gap-[8px]">
      <label class="checkbox-label">
        <input
          v-model="localSettings.notificationsEnabled"
          type="checkbox"
          :disabled="readonly" />
        <span>Включить системные уведомления</span>
      </label>
    </div>

    <!-- Enable Fuzz -->
    <div class="form-section flex flex-col gap-[8px]">
      <label class="checkbox-label">
        <input
          v-model="localSettings.enableFuzz"
          type="checkbox"
          :disabled="readonly" />
        <span>Включить размытие интервалов (fuzz)</span>
      </label>
      <p class="help-text">Добавляет случайную вариацию к интервалам повторения для более естественного распределения карточек</p>
    </div>

    <!-- Learning Steps -->
    <div class="form-section flex flex-col gap-[8px]">
      <label>Шаги обучения (минуты)</label>
      <Input
        v-model="displayLearningSteps"
        type="text"
        placeholder="10, 240"
        :disabled="readonly" />
      <p class="help-text">Интервалы для новых карточек в минутах, разделённые запятой (например: 10, 240)</p>
      <p
        v-if="validation.errors.learningSteps"
        class="error-message">
        {{ validation.errors.learningSteps }}
      </p>
    </div>

    <!-- Дневные лимиты (по всем курсам) - только для глобальных настроек -->
    <div
      v-if="!isCourseSettings"
      class="form-section flex flex-col gap-[8px]">
      <h3>Дневные лимиты (по всем курсам)</h3>

      <label>Новых карточек в день</label>
      <Input
        v-model.number="localSettings.globalNewCardsPerDay"
        type="number"
        min="0"
        :disabled="readonly" />
      <p class="help-text">Максимальное количество новых карточек для изучения в день по всем курсам суммарно</p>

      <label>Повторений в день</label>
      <Input
        v-model.number="localSettings.globalMaxReviewsPerDay"
        type="number"
        min="0"
        :disabled="readonly" />
      <p class="help-text">Максимальное количество повторений в день по всем курсам суммарно</p>
    </div>

    <!-- Дефолтные лимиты курсов (для новых курсов и тех, у которых нет индивидуальных настроек) -->
    <div
      v-if="!isCourseSettings"
      class="form-section flex flex-col gap-[8px]">
      <h3>Лимиты курсов по умолчанию</h3>
      <p class="section-desc text-sm text-gray-400 mb-2">Эти настройки применяются ко всем курсам, у которых нет индивидуальных лимитов</p>

      <label>Новых карточек в день (на курс)</label>
      <Input
        v-model.number="localSettings.defaultNewCardsPerDay"
        type="number"
        min="0"
        :disabled="readonly" />

      <label>Повторений в день (на курс)</label>
      <Input
        v-model.number="localSettings.defaultMaxReviewsPerDay"
        type="number"
        min="0"
        :disabled="readonly" />

      <label>Новых карточек за сессию (на курс)</label>
      <Input
        v-model.number="localSettings.defaultNewCardsPerSession"
        type="number"
        min="0"
        :disabled="readonly" />

      <label>Повторений за сессию (на курс)</label>
      <Input
        v-model.number="localSettings.defaultMaxReviewsPerSession"
        type="number"
        min="0"
        :disabled="readonly" />
    </div>

    <!-- Курсовые дневные лимиты - только для настроек курса -->
    <div
      v-if="isCourseSettings"
      class="form-section flex flex-col gap-[8px]">
      <h3>Дневные лимиты курса</h3>

      <label>Новых карточек в день</label>
      <Input
        v-model.number="localSettings.newCardsPerDay"
        type="number"
        min="0"
        :disabled="readonly"
        placeholder="Наследуется от глобальных" />
      <p class="help-text">Максимальное количество новых карточек для изучения в день в этом курсе (оставьте пустым для наследования)</p>

      <label>Повторений в день</label>
      <Input
        v-model.number="localSettings.maxReviewsPerDay"
        type="number"
        min="0"
        :disabled="readonly"
        placeholder="Наследуется от глобальных" />
      <p class="help-text">Максимальное количество повторений в день в этом курсе (оставьте пустым для наследования)</p>
    </div>

    <!-- Сессионные лимиты - только для настроек курса -->
    <div
      v-if="isCourseSettings"
      class="form-section flex flex-col gap-[8px]">
      <h3>Сессионные лимиты</h3>

      <label>Новых карточек за сессию</label>
      <Input
        v-model.number="localSettings.newCardsPerSession"
        type="number"
        min="0"
        :disabled="readonly"
        placeholder="Наследуется от глобальных" />
      <p class="help-text">Максимальное количество новых карточек за одну тренировку</p>

      <label>Повторений за сессию</label>
      <Input
        v-model.number="localSettings.maxReviewsPerSession"
        type="number"
        min="0"
        :disabled="readonly"
        placeholder="Наследуется от глобальных" />
      <p class="help-text">Максимальное количество повторений за одну тренировку</p>
    </div>

    <!-- Preview текущего расписания -->
    <div
      class="form-section flex flex-col gap-[8px] preview bg-gray-500/20 border border-white/30 backdrop-blur-md bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15)_0%,transparent_50%)] p-4 rounded-xl shadow-lg">
      <h4>Текущее расписание</h4>
      <p>
        Тренировки доступны с
        <strong>{{ formatTime(localSettings.trainingStartTime) }}</strong>
        до
        <strong>{{ formatTime(localSettings.trainingEndTime) }}</strong>
      </p>
      <p>
        Новые карточки не показываются после
        <strong>{{ formatTime(localSettings.trainingEndTime - localSettings.minTimeBeforeEnd * 60) }}</strong>
      </p>
    </div>

    <!-- Кнопка сохранить -->
    <div
      v-if="!readonly && showSaveButton"
      class="form-actions">
      <Button
        :disabled="!validation.isValid"
        @click="handleSave">
        Сохранить настройки
      </Button>
    </div>
  </div>
</template>

<style scoped>
  .form-section h3 {
    font-size: var(--text-section-title-size);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .form-section h4 {
    font-size: var(--text-body-lg-size);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .form-section label:not(.checkbox-label) {
    font-size: var(--text-caption-size);
    font-weight: 500;
    color: var(--color-text-tertiary);
  }

  .error-message {
    color: var(--color-danger);
    font-size: var(--text-body-md-size);
  }

  .help-text {
    color: var(--color-text-tertiary);
    font-size: var(--text-body-md-size);
  }

  .preview {
    color: var(--color-text-primary);
  }

  .preview p {
    margin: 4px 0;
    color: inherit;
    font-size: var(--text-body-md-size);
    opacity: 0.9;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: var(--text-body-md-size);
    color: var(--color-text-primary);
  }

  .checkbox-label input[type='checkbox'] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .checkbox-label input[type='checkbox']:disabled {
    cursor: not-allowed;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
</style>
