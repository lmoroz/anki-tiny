<script setup>
defineProps({
  padding: {
    type: String,
    default: 'md'
  },
  hoverable: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <div :class="['card', `card-padding-${padding}`, { 'card-hoverable': hoverable }]">
    <slot />
  </div>
</template>

<style scoped>
.card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card-padding-sm {
  padding: 12px;
}

.card-padding-md {
  padding: 20px;
}

.card-padding-lg {
  padding: 28px;
}

.card-hoverable {
  cursor: pointer;
}

.card-hoverable:hover {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
</style>
