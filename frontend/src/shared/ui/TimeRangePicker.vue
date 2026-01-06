<script setup>
import { computed } from 'vue'

const props = defineProps({
  start: {
    type: Number,
    required: true
  },
  end: {
    type: Number,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:start', 'update:end'])

const hours = Array.from({ length: 24 }, (_, i) => i)

const visualRange = computed(() => {
  const total = 24
  const startPercent = (props.start / total) * 100
  const endPercent = (props.end / total) * 100
  return {
    left: `${startPercent}%`,
    width: `${endPercent - startPercent}%`
  }
})
</script>

<template>
  <div class="time-range-picker">
    <div class="selectors">
      <div class="selector-group">
        <label>Начало дня</label>
        <select
          :value="start"
          :disabled="disabled"
          @change="emit('update:start', Number($event.target.value))">
          <option
            v-for="hour in hours"
            :key="hour"
            :value="hour">
            {{ hour.toString().padStart(2, '0') }}:00
          </option>
        </select>
      </div>

      <div class="selector-group">
        <label>Конец дня</label>
        <select
          :value="end"
          :disabled="disabled"
          @change="emit('update:end', Number($event.target.value))">
          <option
            v-for="hour in hours"
            :key="hour"
            :value="hour">
            {{ hour.toString().padStart(2, '0') }}:00
          </option>
        </select>
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
.time-range-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selectors {
  display: flex;
  gap: 16px;
}

.selector-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selector-group label {
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  margin-bottom: 4px;
}

.selector-group select {
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.4);
  color: #e9ecef;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.selector-group select:hover:not(:disabled) {
  border-color: rgba(59, 130, 246, 0.5);
}

.selector-group select:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.selector-group select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(30, 41, 59, 0.2);
}

.timeline {
  position: relative;
}

.timeline-track {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.timeline-active {
  position: absolute;
  height: 100%;
  background: #1a73e8;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
}
</style>
