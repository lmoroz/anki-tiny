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
    if (props.variant === 'primary') additional.push('shadow-[0_10px_20px_-5px_rgba(37,99,235,0.6)]')
    return [...additional]
  })
  const innerClasses = computed(() => {
    let additional = ['btn', `btn-${props.size}`, { 'btn-full-width': props.fullWidth }, { 'btn-disabled': props.disabled }, `rounded-${props.rounded}`]
    if (props.stacked && props.variant === 'primary') {
      additional.push(
        ...`relative z-20 bg-gradient-to-b from-[#3b82f6] to-[#2563eb] hover:to-[#3b82f6]  py-4 px-12 border-t border-t-white/20 border-b border-b-gray-800/50  shadow-[0_10px_20px_-5px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform duration-200 group-active:translate-y-[2px]`.split(
          ' '
        )
      )
    } else if (props.variant === 'primary') {
      additional.push(
        'bg-gradient-to-b from-[#3b82f6] to-[#2563eb] shadow-[0_10px_20px_-5px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.3)]'.split(' ')
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
    class="!select-none"
    :class="buttonClasses"
    @click="handleClick"
    :disabled="disabled">
    <template v-if="props.stacked">
      <!-- Stack Layer 2 (Bottom-most - Darkest) -->
      <div
        class="absolute inset-0 bg-[#2563eb] translate-y-[12px] scale-x-[0.93] z-0 transition-transform duration-200 group-active:translate-y-[8px] shadow-[0_2px_2px_-1px_rgba(0,0,0,1)] border-b border-b-gray-800/80 opacity-20"
        :class="`rounded-${props.rounded}`" />

      <!-- Stack Layer 1 (Middle - Dark) -->
      <div
        class="absolute inset-0 bg-[#2563eb] translate-y-[6px] scale-x-[0.965] z-10 transition-transform duration-200 group-active:translate-y-[4px] shadow-[0_2px_2px_-1px_rgba(0,0,0,1)] border-b border-b-gray-800/80 opacity-30"
        :class="`rounded-${props.rounded}`" />
    </template>

    <!-- Main Surface (Top - Bright Gradient) -->
    <div
      class="text-white !select-none"
      :class="innerClasses">
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
    background: #5f636880;
    border: 1px solid #dadce080;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .btn-secondary:hover {
    background: #f8f9fa;
    border-color: #dadce0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .btn-danger {
    background: #d9302580;
    color: #fff;
    box-shadow: 0 1px 3px rgba(217, 48, 37, 0.3);
  }

  .btn-danger:hover {
    background: #b31412;
    box-shadow: 0 2px 8px rgba(217, 48, 37, 0.4);
  }

  .btn-ghost {
    background: transparent;
    color: #ffffff80;
  }

  .btn-ghost:hover {
    color: #ffffff;
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
