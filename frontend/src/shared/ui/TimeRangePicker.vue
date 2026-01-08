<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    start: {
      type: Number,
      required: true, // Minutes from midnight (0-1439)
    },
    end: {
      type: Number,
      required: true, // Minutes from midnight (0-1439)
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(['update:start', 'update:end']);

  // Convert minutes to hours/minutes
  const startHours = computed(() => Math.floor(props.start / 60));
  const startMinutes = computed(() => props.start % 60);
  const endHours = computed(() => Math.floor(props.end / 60));
  const endMinutes = computed(() => props.end % 60);

  // Handlers to convert back to minutes
  function updateStartHours(hours) {
    emit('update:start', hours * 60 + startMinutes.value);
  }

  function updateStartMinutes(minutes) {
    emit('update:start', startHours.value * 60 + minutes);
  }

  function updateEndHours(hours) {
    emit('update:end', hours * 60 + endMinutes.value);
  }

  function updateEndMinutes(minutes) {
    emit('update:end', endHours.value * 60 + minutes);
  }

  const visualRange = computed(() => {
    const totalMinutes = 24 * 60; // 1440 minutes in a day
    const startPercent = (props.start / totalMinutes) * 100;
    const endPercent = (props.end / totalMinutes) * 100;
    return {
      left: `${startPercent}%`,
      width: `${endPercent - startPercent}%`,
    };
  });
</script>

<template>
  <div class="time-range-picker flex flex-col gap-[16px]">
    <div class="selectors flex gap-[16px]">
      <div class="selector-group flex flex-col flex-1 gap-[8px]">
        <label>Начало дня</label>
        <div class="flex items-center">
          <ScrollTimePicker
            :model-value="startHours"
            :max="23"
            suffix="ч"
            :disabled="disabled"
            @update:model-value="updateStartHours" />
          <ScrollTimePicker
            :model-value="startMinutes"
            :max="59"
            :step="1"
            suffix="м"
            :disabled="disabled"
            @update:model-value="updateStartMinutes" />
        </div>
      </div>

      <div class="selector-group flex flex-col flex-1 gap-[8px]">
        <label>Конец дня</label>
        <div class="flex items-center">
          <ScrollTimePicker
            :model-value="endHours"
            :max="23"
            suffix="ч"
            :disabled="disabled"
            @update:model-value="updateEndHours" />
          <ScrollTimePicker
            :model-value="endMinutes"
            :max="59"
            :step="1"
            suffix="м"
            :disabled="disabled"
            @update:model-value="updateEndMinutes" />
        </div>
      </div>
    </div>

    <!-- Визуализация -->
    <div class="timeline">
      <div class="timeline-track">
        <div
          class="timeline-active"
          :style="visualRange" />
      </div>
      <div class="timeline-labels">
        <span>0:00</span>
        <span>6:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .selector-group label {
    font-size: var(--text-caption-size);
    font-weight: 500;
    color: var(--color-text-tertiary);
  }

  .separator {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    user-select: none;
  }

  .timeline {
    position: relative;
  }

  .timeline-track {
    height: 8px;
    background: var(--spinner-track);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }

  .timeline-active {
    position: absolute;
    height: 100%;
    background: var(--color-primary);
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .timeline-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: var(--text-caption-size);
    color: var(--color-text-tertiary);
  }
</style>
