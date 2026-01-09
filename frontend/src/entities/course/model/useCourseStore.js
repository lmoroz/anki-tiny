import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { coursesApi } from '@/shared/api/courses';

/**
 * Pinia store для управления курсами
 */
export const useCourseStore = defineStore('course', () => {
  // State
  const courses = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const sortedCourses = computed(() => {
    return [...courses.value].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  });

  const getCourseById = computed(() => {
    return (id) => courses.value.find((course) => course.id === id);
  });

  // Actions
  async function fetchCourses() {
    loading.value = true;
    error.value = null;
    try {
      courses.value = await coursesApi.getAll();
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка загрузки курсов';
      console.error('[Course Store] Failed to fetch courses:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createCourse(data) {
    loading.value = true;
    error.value = null;
    try {
      const newCourse = await coursesApi.create(data);
      courses.value.push(newCourse);
      return newCourse;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка создания курса';
      console.error('[Course Store] Failed to create course:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateCourse(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const updatedCourse = await coursesApi.update(id, data);
      const index = courses.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        courses.value[index] = updatedCourse;
      }
      return updatedCourse;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка обновления курса';
      console.error('[Course Store] Failed to update course:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCourse(id) {
    loading.value = true;
    error.value = null;
    try {
      await coursesApi.delete(id);
      courses.value = courses.value.filter((c) => c.id !== id);
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка удаления курса';
      console.error('[Course Store] Failed to delete course:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Обновить статистику курсов из SSE данных
   * @param {Array} statsData - массив { courseId, stats }
   */
  function updateCoursesStats(statsData) {
    if (!Array.isArray(statsData)) return;

    for (const { courseId, stats } of statsData) {
      const course = courses.value.find((c) => c.id === courseId);
      if (course) course.stats = stats;
    }
  }

  return {
    // State
    courses,
    loading,
    error,
    // Getters
    sortedCourses,
    getCourseById,
    // Actions
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    updateCoursesStats,
  };
});
