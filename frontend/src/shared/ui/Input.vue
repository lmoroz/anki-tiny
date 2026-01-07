<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text',
      validator: value => ['text', 'textarea', 'number', 'email', 'password'].includes(value)
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
    },
    stacked: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const inputClasses = computed(() => {
    return ['input-field', { 'input-error': props.error }]
  })

  const handleInput = event => {
    emit('update:modelValue', event.target.value)
  }
</script>

<template>
  <div class="input-wrapper">
    <label
      v-if="label"
      class="text-blue-100/60 text-sm font-medium ml-2 tracking-wider">
      {{ label }}
    </label>

    <div
      v-if="type === 'textarea' && stacked"
      class="relative w-full mb-8">
      <!-- Bottom Stack Layer -->
      <div class="absolute inset-0 bg-gray-700 rounded-2xl transform translate-y-5 scale-[0.95] border border-white/5 z-0 opacity-70" />

      <!-- Middle Stack Layer -->
      <div class="absolute inset-0 bg-gray-700 rounded-2xl transform translate-y-1.75 scale-[0.975] border border-white/5 z-0 opacity-70" />

      <!-- Top Layer (Actual Textarea) -->
      <textarea
        class="relative z-10 w-full rounded-2xl px-6 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400/40 focus:border-blue-400/40 resize-none transition-all text-lg leading-relaxed shadow-xl border border-white/10 bg-gray-700 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15)_0%,transparent_50%)]"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :rows="rows"
        @input="handleInput"
        spellcheck="false" />
    </div>

    <textarea
      v-else-if="type === 'textarea'"
      class="bg-gray-500/20 border border-white/30 backdrop-blur-md"
      :class="inputClasses"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      @input="handleInput" />

    <input
      v-else
      class="bg-gray-500/20 border border-white/30 backdrop-blur-md"
      :class="inputClasses"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="handleInput" />

    <div
      v-if="error"
      class="input-error-message">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-field {
    padding: 10px 14px;
    border-radius: 8px;
    color: var(--color-text-primary);
    font-size: 14px;
    transition: all 0.2s ease;
    outline: none;
  }

  .input-field::placeholder {
    color: var(--color-text-placeholder);
  }

  .input-field:focus {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px var(--input-focus-shadow);
  }

  .input-field:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--color-bg-secondary);
  }

  .input-field.input-error {
    border-color: var(--color-border-error);
  }

  .input-field.input-error:focus {
    box-shadow: 0 0 0 3px var(--input-error-shadow);
  }

  .input-error-message {
    font-size: 12px;
    color: var(--color-danger);
  }

  textarea.input-field {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    line-height: 1.5;
  }
</style>
