<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    variant: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'secondary', 'danger', 'ghost'].includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: value => ['sm', 'md', 'lg'].includes(value)
    },
    rounded: {
      type: String,
      default: 'xl',
      validator: value => ['xl', 'sm', 'md', 'lg', 'full'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    ghost: {
      type: Boolean,
      default: false
    },
    fullWidth: {
      type: Boolean,
      default: false
    },
    stacked: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['click'])

  const buttonClasses = computed(() => {
    let additional = ['cursor-pointer', 'outline-none', `rounded-${props.rounded}`]
    if (props.stacked) additional.push(...['relative', 'group'])
    if (props.variant === 'primary') additional.push('shadow-[0_10px_20px_-5px_var(--btn-primary-shadow)]')
    return [...additional]
  })
  const innerClasses = computed(() => {
    let additional = [
      'btn',
      `btn-${props.size}`,
      { 'btn-full-width': props.fullWidth },
      { 'btn-disabled': props.disabled },
      `rounded-${props.rounded}`,
      { ghost: props.ghost }
    ]
    if (props.stacked && props.variant === 'primary') {
      additional.push(
        ...`relative z-20 bg-gradient-to-b from-[var(--btn-primary-gradient-from)] to-[var(--btn-primary-gradient-to)] hover:to-[var(--btn-primary-gradient-from)]  py-4 px-12 border-t border-t-white/20 border-b border-b-gray-800/50  shadow-[0_10px_20px_-5px_var(--btn-primary-shadow),inset_0_1px_0_var(--btn-primary-inner-shadow)] transition-transform duration-200 group-active:translate-y-[2px]`.split(
          ' '
        )
      )
    } else if (props.variant === 'primary') {
      additional.push(
        'bg-gradient-to-b from-[var(--btn-primary-gradient-from)] to-[var(--btn-primary-gradient-to)] shadow-[0_10px_20px_-5px_var(--btn-primary-shadow),inset_0_1px_0_var(--btn-primary-inner-shadow)]'.split(
          ' '
        )
      )
    } else additional.push(`btn-${props.variant}`)
    return additional
  })

  const handleClick = event => {
    if (!props.disabled) {
      emit('click', event)
    }
  }
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    class="!select-none"
    @click="handleClick">
    <template v-if="props.stacked">
      <!-- Stack Layer 2 (Bottom-most - Darkest) -->
      <div
        :class="`rounded-${props.rounded}`"
        class="absolute inset-0 bg-[var(--btn-primary-gradient-to)] translate-y-[12px] scale-x-[0.93] z-0 transition-transform duration-200 group-active:translate-y-[8px] shadow-[0_2px_2px_-1px_rgba(0,0,0,1)] border-b border-b-gray-800/80 opacity-20" />

      <!-- Stack Layer 1 (Middle - Dark) -->
      <div
        :class="`rounded-${props.rounded}`"
        class="absolute inset-0 bg-[var(--btn-primary-gradient-to)] translate-y-[6px] scale-x-[0.965] z-10 transition-transform duration-200 group-active:translate-y-[4px] shadow-[0_2px_2px_-1px_rgba(0,0,0,1)] border-b border-b-gray-800/80 opacity-30" />
    </template>

    <!-- Main Surface (Top - Bright Gradient) -->
    <div
      :class="innerClasses"
      class="text-white !select-none">
      <slot />
    </div>
  </button>
</template>

<style scoped>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    user-select: none !important;
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

  .btn:hover {
    transform: scale(1.03) translateY(-2px);
  }

  /* Variants */
  .btn-secondary {
    background: var(--action-btn-bg);
    color: var(--action-btn-text);
    border: 1px solid var(--color-border);
    box-shadow: 0 1px 2px var(--btn-secondary-shadow);
  }

  .btn-secondary:hover {
    background: var(--action-btn-bg-hover);
    color: var(--action-btn-text-hover);
    border-color: var(--color-border);
    box-shadow: 0 1px 3px var(--btn-secondary-shadow-hover);
  }

  .btn-danger {
    background: var(--color-danger);
    color: #fff;
    box-shadow: 0 1px 3px var(--btn-danger-shadow);
  }

  .btn-danger:hover {
    background: var(--btn-danger-bg-hover);
    box-shadow: 0 2px 8px var(--btn-danger-shadow-hover);
  }

  .btn-danger.ghost {
    color: var(--color-danger);
    background: transparent;
    box-shadow: none;
  }

  .btn-danger.ghost:hover {
    color: var(--btn-danger-bg-hover);
    box-shadow: 0 2px 8px var(--btn-danger-shadow-hover);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .btn-ghost:hover {
    color: var(--color-text-primary);
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
