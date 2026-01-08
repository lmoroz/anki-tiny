<script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { toast } from 'vue3-toastify';
  import { useSettingsStore } from '@/entities/settings/model/useSettingsStore.js';
  import { useCourseStore } from '@/entities/course/model/useCourseStore.js';

  const router = useRouter();
  const settingsStore = useSettingsStore();
  const courseStore = useCourseStore();

  const globalSettings = ref(null);
  const loading = ref(true);

  // Модальное окно настроек курса
  const showCourseModal = ref(false);
  const selectedCourseId = ref(null);

  // Дефолтные значения настроек
  const DEFAULT_SETTINGS = {
    trainingStartTime: 480, // 08:00 в минутах (8 * 60)
    trainingEndTime: 1320, // 22:00 в минутах (22 * 60)
    minTimeBeforeEnd: 4,
    notificationsEnabled: true,
    enableFuzz: true,
  };

  onMounted(async () => {
    try {
      await Promise.all([settingsStore.fetchGlobalSettings(), courseStore.fetchCourses()]);
      // Используем настройки из store или дефолтные значения
      globalSettings.value = { ...(settingsStore.globalSettings || DEFAULT_SETTINGS) };
    } catch (error) {
      console.error('Failed to load settings:', error);
      // При ошибке используем дефолтные значения
      globalSettings.value = { ...DEFAULT_SETTINGS };
      toast.error('Failed to load settings:' + error.message);
    } finally {
      loading.value = false;
    }
  });

  function handleBack() {
    router.push('/');
  }

  async function handleSaveGlobal(settings) {
    try {
      await settingsStore.updateGlobalSettings(settings);
      toast.success('Глобальные настройки сохранены!');
    } catch (error) {
      toast.error('Ошибка сохранения: ' + error.message);
    }
  }

  function openCourseSettings(courseId) {
    selectedCourseId.value = courseId;
    showCourseModal.value = true;
  }

  function closeCourseModal() {
    showCourseModal.value = false;
    selectedCourseId.value = null;
  }

  const sortedCourses = computed(() => courseStore.sortedCourses);

  const selectedCourse = computed(() => {
    if (!selectedCourseId.value) return null;
    return courseStore.getCourseById(selectedCourseId.value);
  });
</script>

<template>
  <div class="settings-page">
    <div class="items-center justify-start mb-2">
      <Button
        @click="handleBack"
        variant="ghost"
        size="sm">
        <i class="bi bi-arrow-left" />
        Назад
      </Button>
    </div>
    <div class="page-header">
      <h1>Настройки</h1>
    </div>

    <div
      v-if="loading"
      class="loading">
      Загрузка настроек...
    </div>

    <div
      v-else
      class="settings-content">
      <!-- Глобальные настройки -->
      <section class="settings-section">
        <Card>
          <h2>Глобальные настройки</h2>
          <p class="section-description">
            Эти настройки применяются ко всем курсам по умолчанию. Вы можете переопределить их для отдельных курсов.
          </p>
          <SettingsForm
            v-if="globalSettings"
            v-model="globalSettings"
            @save="handleSaveGlobal" />
        </Card>
      </section>

      <!-- Настройки курсов -->
      <section class="settings-section">
        <Card>
          <h2>Настройки курсов</h2>
          <p class="section-description">Настройте индивидуальные параметры для конкретных курсов</p>

          <div class="courses-list flex flex-col gap-4">
            <div
              v-for="course in sortedCourses"
              :key="course.id"
              class="course-settings-item flex items-start justify-between gap-2 p-2">
              <div class="course-info">
                <h3>{{ course.name }}</h3>
              </div>
              <span
                v-if="settingsStore.hasCustomSettings(course.id)"
                class="badge custom ml-auto inline-flex">
                Индивид
                <span>уальные</span>
              </span>
              <span
                v-else
                class="badge inherited ml-auto inline-flex">
                Глоб
                <span>альные</span>
              </span>
              <Button
                class="course-settings-button"
                variant="secondary"
                ghost
                size="xs"
                rounded="sm"
                @click="openCourseSettings(course.id)">
                <i
                  data-v-8da49e22=""
                  class="bi bi-gear" />
                <span>Настроить</span>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>

    <!-- Модальное окно настроек курса -->
    <CourseSettingsModal
      v-if="selectedCourse"
      :show="showCourseModal"
      :course-id="selectedCourse.id"
      :course-name="selectedCourse.name"
      @close="closeCourseModal"
      @saved="closeCourseModal" />
  </div>
</template>

<style scoped>
  .settings-page {
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .page-header h1 {
    font-size: 32px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    color: #94a3b8;
    font-size: 16px;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .settings-section h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #f1f5f9;
  }

  .section-description {
    color: var(--color-text-muted);
    font-size: var(--text-body-md-size);
  }

  .course-settings-item {
    background: rgba(148, 163, 184, 0.1);
    border-radius: 8px;
  }

  .course-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .course-info h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #f1f5f9;
  }

  .badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .badge.custom {
    background: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
  }

  .badge.inherited {
    background: rgba(148, 163, 184, 0.2);
    color: #cbd5e1;
  }

  @media (max-width: 1023px) {
    .course-settings-button span,
    .badge span {
      display: none;
    }
  }
</style>
