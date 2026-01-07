<script setup>
  const props = defineProps({
    padding: {
      type: String,
      default: 'md',
      validator: value => ['sm', 'md', 'lg'].includes(value)
    },
    hoverable: {
      type: Boolean,
      default: false
    },
    highlight: {
      type: Boolean,
      default: false
    },
    noShadow: {
      type: Boolean,
      default: false
    },
    rounded: {
      type: String,
      default: 'xl',
      validator: value => ['xl', 'sm', 'md', 'lg', 'full'].includes(value)
    }
  })

  const paddingMap = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-8'
  }
</script>

<template>
  <div
    :class="[
      'card',
      `rounded-${rounded}`,
      paddingMap[padding],
      { 'card-hoverable': hoverable },
      { 'card-highlighted': highlight },
      { 'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]': !noShadow }
    ]"
    class="relative z-20 w-full overflow-hidden border border-white/10 transition-all duration-500">
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
    <div class="card-content relative z-10 flex flex-col gap-10 md:gap-8 sm:gap-6 h-full">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .card-highlighted {
    outline: 2px solid var(--card-highlight-border);
    outline-offset: -2px;
  }

  .card-hoverable {
    cursor: pointer;
  }

  .card-hoverable:hover {
    border-color: var(--color-border);
    box-shadow: 0 4px 12px var(--card-shadow-hover);
    transform: translateY(-2px);
  }
</style>
