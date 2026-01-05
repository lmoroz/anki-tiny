<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const buttonClasses = computed(() => {
  return [
    'btn',
    `btn-${props.variant}`,
    `btn-${props.size}`,
    { 'btn-full-width': props.fullWidth },
    { 'btn-disabled': props.disabled }
  ];
});

const handleClick = (event) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>

<template>
  <button :class="buttonClasses" @click="handleClick" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;
}

.btn:active {
  transform: translateY(1px);
}

/* Sizes */
.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
}

.btn-md {
  padding: 10px 20px;
  font-size: 14px;
}

.btn-lg {
  padding: 12px 28px;
  font-size: 16px;
}

/* Variants */
.btn-primary {
  background: #1a73e8;
  color: #fff;
  box-shadow: 0 1px 3px rgba(26, 115, 232, 0.3);
}

.btn-primary:hover {
  background: #1557b0;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.4);
}

.btn-secondary {
  background: #fff;
  color: #5f6368;
  border: 1px solid #dadce0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #dadce0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-danger {
  background: #d93025;
  color: #fff;
  box-shadow: 0 1px 3px rgba(217, 48, 37, 0.3);
}

.btn-danger:hover {
  background: #b31412;
  box-shadow: 0 2px 8px rgba(217, 48, 37, 0.4);
}

.btn-ghost {
  background: transparent;
  color: #5f6368;
}

.btn-ghost:hover {
  background: #f1f3f4;
}

/* Modifiers */
.btn-full-width {
  width: 100%;
}

.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>

