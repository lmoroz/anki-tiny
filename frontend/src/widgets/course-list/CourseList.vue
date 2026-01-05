<script setup>
import CourseCard from './CourseCard.vue';

const props = defineProps({
  courses: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'edit', 'delete']);

const handleSelect = (course) => {
  emit('select', course);
};

const handleEdit = (course) => {
  emit('edit', course);
};

const handleDelete = (course) => {
  emit('delete', course);
};
</script>

<template>
  <div class="course-list">
    <div v-if="loading" class="loading-state">
      <div class="spinner"/>
      <p>Загрузка курсов...</p>
    </div>
    
    <div v-else-if="courses.length === 0" class="empty-state">
      <p>Нет доступных курсов</p>
    </div>
    
    <div v-else class="courses-grid">
      <CourseCard
        v-for="course in courses"
        :key="course.id"
        :course="course"
        @click="handleSelect"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<style scoped>
.course-list {
  width: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(148, 163, 184, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 15px;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
</style>
