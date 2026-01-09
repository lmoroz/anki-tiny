<script setup>
const props = defineProps({
  courseName: {
    type: String,
    required: true,
  },
  courseColor: {
    type: String,
    default: '#6366f1',
  },
});
</script>

<template>
  <div class="course-badge" :style="{ '--badge-color': courseColor }">
    {{ courseName }}
  </div>
</template>

<style scoped>
.course-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  background: var(--badge-color);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
