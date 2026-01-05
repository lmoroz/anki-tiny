<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'textarea', 'number', 'email', 'password'].includes(value)
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 4
  }
});

const emit = defineEmits(['update:modelValue']);

const inputClasses = computed(() => {
  return [
    'input-field',
    { 'input-error': props.error }
  ];
});

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label">{{ label }}</label>
    
    <textarea
      v-if="type === 'textarea'"
      :class="inputClasses"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      @input="handleInput"
    />
    
    <input
      v-else
      :class="inputClasses"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="handleInput"
    />
    
    <div v-if="error" class="input-error-message">{{ error }}</div>
  </div>
</template>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e1;
}

.input-field {
  padding: 10px 14px;
  background: rgba(100, 116, 139, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.2s ease;
  outline: none;
}

.input-field::placeholder {
  color: #64748b;
}

.input-field:focus {
  border-color: #3b82f6;
  background: rgba(100, 116, 139, 0.2);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-field.input-error {
  border-color: #ef4444;
}

.input-field.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-error-message {
  font-size: 12px;
  color: #ef4444;
}

textarea.input-field {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}
</style>
