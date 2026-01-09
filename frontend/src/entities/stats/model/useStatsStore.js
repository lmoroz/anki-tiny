import { defineStore } from 'pinia';
import { ref } from 'vue';
import { trainingApi } from '@/shared/api/training';

export const useStatsStore = defineStore('stats', () => {
  // State
  const totalNewCards = ref(0);
  const studiedToday = ref(0);
  const remainingToday = ref(0);
  const dailyNewLimit = ref(0);
  const trainingsToday = ref(0);
  const loading = ref(false);
  const error = ref(null);

  // Actions
  async function fetchGlobalStats() {
    loading.value = true;
    error.value = null;

    try {
      // Определяем часовой пояс пользователя
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Получаем единую статистику, передавая timezone
      const stats = await trainingApi.getStats(timezone);

      // Устанавливаем метрики
      totalNewCards.value = stats.totalNewCards;
      studiedToday.value = stats.global.newCardsStudied + stats.global.reviewsCompleted;
      trainingsToday.value = studiedToday.value;

      // Remaining = globalNewRemaining + globalReviewsRemaining
      remainingToday.value =
        stats.global.limits.globalNewCardsPerDay -
        stats.global.newCardsStudied +
        (stats.global.limits.globalMaxReviewsPerDay - stats.global.reviewsCompleted);

      dailyNewLimit.value = stats.global.limits.globalNewCardsPerDay;
    } catch (err) {
      error.value = 'Failed to load statistics';
      console.error('[Stats Store] Failed to fetch global stats:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Обновить статистику из SSE данных (без HTTP запроса, без loading)
   */
  function updateFromSSE(globalStats) {
    if (!globalStats) return;

    totalNewCards.value = globalStats.totalNewCards || 0;
    studiedToday.value =
      (globalStats.global?.newCardsStudied || 0) + (globalStats.global?.reviewsCompleted || 0);
    trainingsToday.value = studiedToday.value;

    if (globalStats.global?.limits) {
      remainingToday.value =
        globalStats.global.limits.globalNewCardsPerDay -
        (globalStats.global.newCardsStudied || 0) +
        (globalStats.global.limits.globalMaxReviewsPerDay - (globalStats.global.reviewsCompleted || 0));

      dailyNewLimit.value = globalStats.global.limits.globalNewCardsPerDay;
    }
  }

  return {
    totalNewCards,
    studiedToday,
    remainingToday,
    dailyNewLimit,
    trainingsToday,
    loading,
    error,
    fetchGlobalStats,
    updateFromSSE,
  };
});
