<script setup>
  const props = defineProps({
    checked: {
      type: Boolean,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(['update:checked']);

  const handleClick = () => {
    if (!props.disabled) emit('update:checked', !props.checked);
  };
</script>

<template>
  <div
    :aria-checked="checked"
    :aria-disabled="disabled"
    :class="{ checked, disabled }"
    aria-label="Выбрать карточку"
    class="checkbox"
    role="checkbox"
    tabindex="0"
    @click.stop="handleClick"
    @keydown.space.prevent="handleClick">
    <i
      v-if="checked"
      class="bi bi-check" />
  </div>
</template>

<style scoped>
  .checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-border);
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .checkbox:hover:not(.disabled) {
    border-color: var(--color-primary);
  }

  .checkbox.checked {
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    border-color: var(--color-primary);
  }

  .checkbox.checked i {
    color: white;
    font-size: 14px;
  }

  .checkbox.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
