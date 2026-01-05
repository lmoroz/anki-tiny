<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCourseStore } from '@/entities/course/model/useCourseStore';
import Card from '@/shared/ui/Card.vue';
import Button from '@/shared/ui/Button.vue';
import CourseList from '@/widgets/course-list/CourseList.vue';
import CourseEditorModal from '@/widgets/course-editor/CourseEditorModal.vue';

const router = useRouter();
const courseStore = useCourseStore();

const showEditorModal = ref(false);
const editingCourse = ref(null);

const isLoading = computed(() => courseStore.loading);
const courses = computed(() => courseStore.sortedCourses);

onMounted(async () => {
  try {
    await courseStore.fetchCourses();
  } catch (error) {
    console.error('[HomePage] Failed to load courses:', error);
  }
});

const handleCreateCourse = () => {
  editingCourse.value = null;
  showEditorModal.value = true;
};

const handleEditCourse = (course) => {
  editingCourse.value = course;
  showEditorModal.value = true;
};

const handleDeleteCourse = async (course) => {
  const confirmed = confirm(`Вы уверены, что хотите удалить курс "${course.name}"?`);
  if (!confirmed) return;
  
  try {
    await courseStore.deleteCourse(course.id);
  } catch (error) {
    alert('Ошибка при удалении курса. Попробуйте еще раз.');
  }
};

const handleSelectCourse = (course) => {
  router.push(`/course/${course.id}`);
};

const handleSaveCourse = async (data) => {
  try {
    if (editingCourse.value) {
      await courseStore.updateCourse(editingCourse.value.id, data);
    } else {
      await courseStore.createCourse(data);
    }
    showEditorModal.value = false;
    editingCourse.value = null;
  } catch (error) {
    alert('Ошибка при сохранении курса. Попробуйте еще раз.');
  }
};

const handleCloseModal = () => {
  showEditorModal.value = false;
  editingCourse.value = null;
};
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Мои курсы</h1>
        <p class="page-subtitle">Управление курсами и карточками для обучения</p>
      </div>
      <Button @click="handleCreateCourse" variant="primary">
        <i class="bi bi-plus-lg"/>
        Создать курс
      </Button>
    </div>

    <div v-if="isLoading && courses.length === 0" class="loading-state">
      <div class="spinner"/>
      <p>Загрузка курсов...</p>
    </div>

    <div v-else-if="courses.length === 0" class="empty-state">
      <Card padding="lg">
        <div class="empty-state-content">
          <i class="bi bi-journal-bookmark empty-state-icon"/>
          <h2 class="empty-state-title">Нет курсов</h2>
          <p class="empty-state-text">
            Создайте свой первый курс, чтобы начать обучение с помощью интервального повторения
          </p>
          <Button @click="handleCreateCourse" variant="primary" size="lg">
            <i class="bi bi-plus-lg"/>
            Создать первый курс
          </Button>
        </div>
      </Card>
    </div>

    <CourseList
      v-else
      :courses="courses"
      :loading="isLoading"
      @select="handleSelectCourse"
      @edit="handleEditCourse"
      @delete="handleDeleteCourse"
    />

    <CourseEditorModal
      :show="showEditorModal"
      :course="editingCourse"
      @save="handleSaveCourse"
      @close="handleCloseModal"
    />
  </div>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 15px;
  color: #94a3b8;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
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
  margin-top: 40px;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
}

.empty-state-icon {
  font-size: 64px;
  color: #3b82f6;
  margin-bottom: 24px;
  opacity: 0.7;
}

.empty-state-title {
  font-size: 24px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.empty-state-text {
  font-size: 15px;
  color: #94a3b8;
  max-width: 400px;
  margin-bottom: 24px;
  line-height: 1.6;
}
</style>
