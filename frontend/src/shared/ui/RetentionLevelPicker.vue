<script setup>
  const props = defineProps({
    modelValue: {
      type: Number,
      default: 0.9,
    },
    isInherited: {
      type: Boolean,
      default: false,
    },
    globalLevel: {
      type: String,
      default: 'Medium',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    isCourseSettings: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(['update:modelValue']);

  const RETENTION_LEVELS = {
    LOW: {
      value: 0.8,
      label: 'Low (Расслабленный режим)',
      description: 'Меньше повторений, больше забывается. Подходит для долгосрочного изучения',
    },
    MEDIUM: {
      value: 0.9,
      label: 'Medium (Стандарт)',
      description: 'Сбалансированный режим. Подходит для большинства курсов',
    },
    HIGH: {
      value: 0.95,
      label: 'High (Cramming)',
      description: 'Много повторений, почти не забывается. Подходит для экзаменов и cramming',
    },
  };

  function getLevelByValue(value) {
    if (value === 0.8) return 'LOW';
    if (value === 0.95) return 'HIGH';
    return 'MEDIUM';
  }

  function handleChange(level) {
    emit('update:modelValue', RETENTION_LEVELS[level].value);
  }

  function handleInheritedChange() {
    emit('update:modelValue', null);
  }
</script>

<template>
  <div class="retention-level-picker flex flex-col gap-[12px]">
    <label class="text-sm font-medium text-gray-300">Интенсивность обучения</label>

    <div class="levels-container flex flex-col gap-[8px]">
      <!-- Inherited option (только для курсовых настроек) -->
      <label
        v-if="isCourseSettings"
        class="level-option">
        <input
          type="radio"
          :checked="modelValue === null"
          :disabled="readonly"
          @change="handleInheritedChange" />
        <div class="level-info">
          <span class="level-label">Inherited (Наследуется)</span>
          <span class="level-description">Использовать глобальное значение ({{ globalLevel }})</span>
        </div>
      </label>

      <!-- Low -->
      <label
        class="level-option"
        :title="RETENTION_LEVELS.LOW.description">
        <input
          type="radio"
          :checked="modelValue === RETENTION_LEVELS.LOW.value"
          :disabled="readonly"
          @change="handleChange('LOW')" />
        <div class="level-info">
          <span class="level-label">{{ RETENTION_LEVELS.LOW.label }}</span>
          <span class="level-description">{{ RETENTION_LEVELS.LOW.description }}</span>
        </div>
      </label>

      <!-- Medium -->
      <label
        class="level-option"
        :title="RETENTION_LEVELS.MEDIUM.description">
        <input
          type="radio"
          :checked="modelValue === RETENTION_LEVELS.MEDIUM.value"
          :disabled="readonly"
          @change="handleChange('MEDIUM')" />
        <div class="level-info">
          <span class="level-label">{{ RETENTION_LEVELS.MEDIUM.label }}</span>
          <span class="level-description">{{ RETENTION_LEVELS.MEDIUM.description }}</span>
        </div>
      </label>

      <!-- High -->
      <label
        class="level-option"
        :title="RETENTION_LEVELS.HIGH.description">
        <input
          type="radio"
          :checked="modelValue === RETENTION_LEVELS.HIGH.value"
          :disabled="readonly"
          @change="handleChange('HIGH')" />
        <div class="level-info">
          <span class="level-label">{{ RETENTION_LEVELS.HIGH.label }}</span>
          <span class="level-description">{{ RETENTION_LEVELS.HIGH.description }}</span>
        </div>
      </label>
    </div>
  </div>
</template>

<style scoped>
  .retention-level-picker label {
    font-size: var(--text-caption-size);
    font-weight: 500;
    color: var(--color-text-tertiary);
  }

  .levels-container {
    padding: 12px;
    background: var(--input-bg);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .level-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .level-option:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .level-option input[type='radio'] {
    margin-top: 2px;
    width: 18px;
    height: 18px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .level-option input[type='radio']:disabled {
    cursor: not-allowed;
  }

  .level-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .level-label {
    font-size: var(--text-body-md-size);
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .level-description {
    font-size: var(--text-body-sm-size);
    color: var(--color-text-tertiary);
    line-height: 1.4;
  }
</style>
