<script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { toast } from 'vue3-toastify';
  import { useConfirm } from '@/shared/lib/useConfirm';
  import { useCourseStore } from '@/entities/course/model/useCourseStore';

  const router = useRouter();
  const courseStore = useCourseStore();

  const showEditorModal = ref(false);
  const editingCourse = ref(null);

  const isLoading = computed(() => courseStore.loading);
  const courses = computed(() => courseStore.sortedCourses);

  // Подсчет общего количества due карточек
  const totalDueCards = computed(() => {
    return courses.value.reduce((acc, course) => acc + (course.stats?.dueToday || 0), 0);
  });

  const update = async () => {
    try {
      await courseStore.fetchCourses();
      window.setTimeout(update, 5000);
    } catch (error) {
      console.error('[HomePage] Failed to load courses:', error);
      toast.error('Ошибка при загрузке курсов. Попробуйте еще раз.');
    }
  };

  onMounted(async () => {
    await update();
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
    const { confirm } = useConfirm();
    const confirmed = await confirm({
      title: 'Удаление курса',
      message: `Вы уверены, что хотите удалить курс "${course.name}"?`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
    });
    if (!confirmed) return;

    try {
      await courseStore.deleteCourse(course.id);
    } catch (error) {
      toast.error('Ошибка при удалении курса. Попробуйте еще раз.');
    }
  };

  const handleSelectCourse = (course) => {
    router.push(`/course/${course.id}`);
  };

  const handleSaveCourse = async (data) => {
    try {
      if (editingCourse.value) {
        await courseStore.updateCourse(editingCourse.value.id, data);
        toast.success('Курс успешно обновлен!');
      } else {
        await courseStore.createCourse(data);
        toast.success('Курс успешно создан!');
      }
      showEditorModal.value = false;
      editingCourse.value = null;
    } catch (error) {
      toast.error('Ошибка при сохранении курса. Попробуйте еще раз.');
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
        <div class="flex gap-8">
          <h1 class="page-title">Мои курсы</h1>
          <Button
            variant="secondary"
            size="sm"
            gnost
            @click="handleCreateCourse">
            <i class="bi bi-plus-lg" />
            Создать курс
          </Button>
        </div>
        <p class="page-subtitle">Управление курсами и карточками для обучения</p>
      </div>
      <!-- Global Training Button -->
      <Button
        v-if="totalDueCards > 0"
        stacked
        to="/training/global"
        class="global-training-btn">
        <i class="bi bi-lightning-fill" />
        Тренировать всё
        <span class="due-badge">{{ totalDueCards }}</span>
      </Button>
    </div>

    <div
      v-if="isLoading && courses.length === 0"
      class="loading-state">
      <div class="spinner" />
      <p>Загрузка курсов...</p>
    </div>

    <div
      v-else-if="courses.length === 0"
      class="empty-state">
      <Card padding="lg">
        <div class="empty-state-content">
          <i class="bi bi-journal-bookmark empty-state-icon" />
          <h2 class="empty-state-title">Нет курсов</h2>
          <p class="empty-state-text">
            Создайте свой первый курс, чтобы начать обучение с помощью интервального повторения
          </p>
          <Button
            @click="handleCreateCourse"
            variant="primary"
            size="lg">
            <i class="bi bi-plus-lg" />
            Создать первый курс
          </Button>
        </div>
      </Card>
    </div>

    <!-- Two-column layout for courses and stats -->
    <div
      v-else
      class="home-grid">
      <!-- Left column: Courses -->
      <div class="courses-column">
        <CourseList
          :courses="courses"
          :loading="isLoading"
          @select="handleSelectCourse"
          @edit="handleEditCourse"
          @delete="handleDeleteCourse" />
      </div>

      <!-- Right column: Statistics -->
      <div class="stats-column">
        <GlobalStats />
      </div>
    </div>

    <CourseEditorModal
      :show="showEditorModal"
      :course="editingCourse"
      @save="handleSaveCourse"
      @close="handleCloseModal" />
  </div>
</template>

<style scoped>
  .page-container {
    max-width: 1600px;
    width: 90%;
    margin: 0 auto;
    padding: 40px 32px;
  }

  .home-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  @media (max-width: 1024px) {
    .home-grid {
      grid-template-columns: 1fr;
    }

    .stats-column {
      order: -1;
    }
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
  }

  .page-title {
    font-size: var(--text-page-title-size);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }

  .page-subtitle {
    font-size: var(--text-body-lg-size);
    color: var(--color-text-tertiary);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    gap: 16px;
    color: var(--color-text-muted);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--spinner-track);
    border-top-color: var(--spinner-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    margin-top: 40px;
  }

  .empty-state-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 48px 24px;
  }

  .empty-state-icon {
    font-size: 64px;
    color: var(--color-primary);
    margin-bottom: 24px;
    opacity: 0.9;
  }

  .empty-state-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 12px;
  }

  .empty-state-text {
    font-size: var(--text-body-lg-size);
    color: var(--color-text-primary);
    max-width: 400px;
    margin-bottom: 28px;
    line-height: 1.6;
  }

  .due-badge {
    margin-left: auto;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
  }
</style>
