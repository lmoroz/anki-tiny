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
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.25s ease;
}

.card-padding-sm {
  padding: 16px;
}

.card-padding-md {
  padding: 24px;
}

.card-padding-lg {
  padding: 32px;
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

