<script setup>
  import { ref, computed, watch } from 'vue'
  import TimeRangePicker from '@/shared/ui/TimeRangePicker.vue'
  import Input from '@/shared/ui/Input.vue'

  const props = defineProps({
    modelValue: {
      type: Object,
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue', 'save'])

  const localSettings = ref({ ...props.modelValue })

  // Validation
  const validation = computed(() => {
    const errors = {}

    if (localSettings.value.trainingStartHour >= localSettings.value.trainingEndHour) {
      errors.timeRange = 'Начало дня должно быть раньше конца'
    }

    const duration = (localSettings.value.trainingEndHour - localSettings.value.trainingStartHour + 24) % 24
    if (duration < localSettings.value.minTimeBeforeEnd) {
      errors.minTime = 'Диапазон тренировок слишком короткий для указанного минимального времени'
    }

    if (localSettings.value.minTimeBeforeEnd < 1 || localSettings.value.minTimeBeforeEnd > 12) {
      errors.minTimeValue = 'Минимальное время должно быть от 1 до 12 часов'
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
    if (validation.value.isValid) emit('save', localSettings.value)
  }
</script>

<template>
  <div class="settings-form">
    <!-- Временной диапазон -->
    <div class="form-section">
      <h3>Временные рамки тренировок</h3>
      <TimeRangePicker
        v-model:start="localSettings.trainingStartHour"
        v-model:end="localSettings.trainingEndHour"
        :disabled="readonly" />
      <p
        v-if="validation.errors.timeRange"
        class="error-message">
        {{ validation.errors.timeRange }}
      </p>
    </div>

    <!-- Минимальное время до конца дня -->
    <div class="form-section">
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
    <div class="form-section">
      <label class="checkbox-label">
        <input
          v-model="localSettings.notificationsEnabled"
          type="checkbox"
          :disabled="readonly" />
        <span>Включить системные уведомления</span>
      </label>
    </div>

    <!-- Preview текущего расписания -->
    <div class="form-section preview">
      <h4>Текущее расписание</h4>
      <p>
        Тренировки доступны с
        <strong>{{ localSettings.trainingStartHour }}:00</strong>
        до
        <strong>{{ localSettings.trainingEndHour }}:00</strong>
      </p>
      <p>
        Новые карточки не показываются после
        <strong>{{ localSettings.trainingEndHour - localSettings.minTimeBeforeEnd }}:00</strong>
      </p>
    </div>

    <!-- Кнопка сохранить -->
    <div
      v-if="!readonly"
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
  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-section h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #f1f5f9;
  }

  .form-section h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #60a5fa;
  }

  .form-section label:not(.checkbox-label) {
    font-size: 13px;
    font-weight: 500;
    color: #94a3b8;
  }

  .error-message {
    color: #fca5a1;
    font-size: 14px;
    margin: 0;
  }

  .help-text {
    color: #94a3b8;
    font-size: 14px;
    margin: 0;
  }

  .preview {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    padding: 16px;
    border-radius: 8px;
  }

  .preview p {
    margin: 4px 0;
    color: #93c5fd;
    font-size: 14px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #e2e8f0;
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

  .btn-primary {
    padding: 10px 24px;
    background: #1a73e8;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary:hover:not(:disabled) {
    background: #1557b0;
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
