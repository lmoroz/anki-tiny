<script setup>
  import { computed } from 'vue';
  import { VueScrollPicker } from 'vue-scroll-picker';
  import 'vue-scroll-picker/style.css';

  const props = defineProps({
    modelValue: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 23,
    },
    step: {
      type: Number,
      default: 1,
    },
    formatDigits: {
      type: Number,
      default: 2,
    },
    suffix: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(['update:modelValue']);

  const options = computed(() => {
    const result = [];
    for (let i = props.min; i <= props.max; i += props.step) {
      result.push({
        name: i.toString().padStart(props.formatDigits, '0') + props.suffix,
        value: i,
      });
    }
    return result;
  });
</script>

<template>
  <VueScrollPicker
    class="vue-scroll-picker"
    :model-value="modelValue"
    :options="options"
    :disabled="disabled"
    :class="{ disabled }"
    @update:model-value="emit('update:modelValue', $event)" />
</template>

<style scoped>
  .vue-scroll-picker.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .vue-scroll-picker :deep(.vue-scroll-picker-item) {
    color: var(--color-text-muted);
  }

  .vue-scroll-picker :deep(.vue-scroll-picker-item[aria-selected='true']) {
    color: var(--color-text-primary);
  }

  .vue-scroll-picker :deep(.vue-scroll-picker-layer-top) {
    border-bottom: 1px solid var(--color-border);
    background: linear-gradient(180deg, var(--btn-primary-shadow) 10%, var(--input-focus-shadow) 100%);
  }

  .vue-scroll-picker :deep(.vue-scroll-picker-layer-bottom) {
    border-top: 1px solid var(--color-border);
    background: linear-gradient(0deg, var(--btn-primary-shadow) 10%, var(--input-focus-shadow) 100%);
  }

  @media (max-width: 768px) {
    .vue-scroll-picker {
      height: 180px;
    }

    .vue-scroll-picker :deep(.vue-scroll-picker-list) {
      padding: 70px 0;
    }

    .vue-scroll-picker :deep(.vue-scroll-picker-item) {
      height: 45px;
      line-height: 45px;
    }
  }
</style>
