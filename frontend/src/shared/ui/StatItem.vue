<script setup>
  defineProps({
    icon: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
  });
</script>

<template>
  <div class="stat-item">
    <i
      :class="`bi bi-${icon}`"
      class="stat-icon"
      :aria-label="label" />
    <span class="stat-label">{{ label }}</span>
    <span class="stat-value">{{ value }}</span>
  </div>
</template>

<style scoped>
  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stat-icon {
    font-size: 24px;
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .stat-label {
    font-size: 14px;
    color: var(--color-text-secondary);
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: var(--color-text-primary);
    text-align: right;
  }
</style>
