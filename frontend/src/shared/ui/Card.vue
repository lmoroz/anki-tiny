<script setup>
  defineProps({
    padding: {
      type: String,
      default: 'md'
    },
    hoverable: {
      type: Boolean,
      default: false
    },
    highlight: {
      type: Boolean,
      default: false
    },
    rounded: {
      type: String,
      default: 'xl',
      validator: value => ['xl', 'sm', 'md', 'lg', 'full'].includes(value)
    }
  })
</script>

<template>
  <div
    :class="[`rounded-${rounded}`, 'card', `card-padding-${padding}`, { 'card-hoverable': hoverable }, { 'card-highlighted': highlight }]"
    class="relative z-20 w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 transition-all duration-500">
    <!-- Card Background Layers -->
    <!-- 1. Base dark tint -->
    <div
      :class="`rounded-${rounded}`"
      class="absolute inset-0 bg-slate-900/20 backdrop-blur-2xl" />

    <!-- 2. Top-Right Sheen -->
    <div
      class="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_50%)] blur-2xl pointer-events-none" />

    <!-- 3. Bottom Gradient Glow -->
    <div class="absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-t from-blue-600/30 via-blue-900/50 to-transparent pointer-events-none" />

    <div
      v-if="highlight"
      class="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(255,255,255,0.7)_0%,transparent_50%)] blur-2xl pointer-events-none" />
    <!-- Content Container -->
    <div class="relative z-10 flex flex-col gap-8">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .card-padding-sm {
    padding: 16px;
  }

  .card-padding-md {
    padding: 24px;
  }

  .card-padding-lg {
    padding: 32px;
  }

  .card-highlighted {
    outline: 2px solid #ffffff80;
    outline-offset: -2px;
  }

  .card-hoverable {
    cursor: pointer;
  }

  .card-hoverable:hover {
    border-color: #dee2e6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
</style>
