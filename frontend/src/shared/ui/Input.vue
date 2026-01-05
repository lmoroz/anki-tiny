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
  gap: 8px;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: #5f6368;
}

.input-field {
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #dadce0;
  border-radius: 8px;
  color: #202124;
  font-size: 14px;
  transition: all 0.2s ease;
  outline: none;
}

.input-field::placeholder {
  color: #80868b;
}

.input-field:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f8f9fa;
}

.input-field.input-error {
  border-color: #d93025;
}

.input-field.input-error:focus {
  box-shadow: 0 0 0 3px rgba(217, 48, 37, 0.1);
}

.input-error-message {
  font-size: 12px;
  color: #d93025;
}

textarea.input-field {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.5;
}
</style>

