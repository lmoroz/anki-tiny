import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { cardsApi } from '@/shared/api/cards';

/**
 * Pinia store для управления карточками
 */
export const useCardStore = defineStore('card', () => {
  // State
  const cardsByCourse = ref({}); // Record<courseId, Card[]>
  const stats = ref({}); // Record<courseId, CourseStats>
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const getCardsByCourse = computed(() => {
    return (courseId) => cardsByCourse.value[courseId] || [];
  });

  const getCourseStats = computed(() => {
    return (courseId) => stats.value[courseId] || null;
  });

  // Actions
  async function fetchCardsByCourse(courseId) {
    loading.value = true;
    error.value = null;
    try {
      const cards = await cardsApi.getByCourseId(courseId);
      cardsByCourse.value[courseId] = cards;
      return cards;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка загрузки карточек';
      console.error('[Card Store] Failed to fetch cards:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCourseStats(courseId) {
    try {
      const courseStats = await cardsApi.getCourseStats(courseId);
      stats.value[courseId] = courseStats;
      return courseStats;
    } catch (err) {
      console.error('[Card Store] Failed to fetch stats:', err);
      throw err;
    }
  }

  async function createCard(courseId, data) {
    loading.value = true;
    error.value = null;
    try {
      const newCard = await cardsApi.create(courseId, data);

      // Добавляем карточку в локальное состояние
      if (!cardsByCourse.value[courseId]) {
        cardsByCourse.value[courseId] = [];
      }
      cardsByCourse.value[courseId].push(newCard);

      // Обновляем статистику
      await fetchCourseStats(courseId);

      return newCard;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка создания карточки';
      console.error('[Card Store] Failed to create card:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateCard(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const updatedCard = await cardsApi.update(id, data);

      // Обновляем карточку в локальном состоянии
      for (const courseId in cardsByCourse.value) {
        const index = cardsByCourse.value[courseId].findIndex((c) => c.id === id);
        if (index !== -1) {
          cardsByCourse.value[courseId][index] = updatedCard;
          break;
        }
      }

      return updatedCard;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка обновления карточки';
      console.error('[Card Store] Failed to update card:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCard(id, courseId) {
    loading.value = true;
    error.value = null;
    try {
      await cardsApi.delete(id);

      // Удаляем карточку из локального состояния
      if (cardsByCourse.value[courseId]) {
        cardsByCourse.value[courseId] = cardsByCourse.value[courseId].filter((c) => c.id !== id);
      }

      // Обновляем статистику
      await fetchCourseStats(courseId);
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка удаления карточки';
      console.error('[Card Store] Failed to delete card:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteBatchCards(ids, courseId) {
    loading.value = true;
    error.value = null;
    try {
      const response = await cardsApi.deleteBatch(courseId, ids);

      // Удаляем карточки из локального состояния
      if (cardsByCourse.value[courseId]) {
        cardsByCourse.value[courseId] = cardsByCourse.value[courseId].filter((c) => !ids.includes(c.id));
      }

      // Обновляем статистику
      await fetchCourseStats(courseId);

      return response.deletedCount;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка массового удаления';
      console.error('[Card Store] Failed to batch delete cards:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAllCards(courseId) {
    loading.value = true;
    error.value = null;
    try {
      const response = await cardsApi.deleteAll(courseId);

      // Очищаем локальное состояние
      cardsByCourse.value[courseId] = [];

      // Обновляем статистику
      await fetchCourseStats(courseId);

      return response.deletedCount;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка удаления карточек';
      console.error('[Card Store] Failed to delete all cards:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    cardsByCourse,
    stats,
    loading,
    error,
    // Getters
    getCardsByCourse,
    getCourseStats,
    // Actions
    fetchCardsByCourse,
    fetchCourseStats,
    createCard,
    updateCard,
    deleteCard,
    deleteBatchCards,
    deleteAllCards,
  };
});
