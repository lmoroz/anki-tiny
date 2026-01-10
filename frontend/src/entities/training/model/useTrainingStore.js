import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { trainingApi } from '@/shared/api/training';

export const useTrainingStore = defineStore('training', () => {
  // State
  const sessionCards = ref([]);
  const sessionLimits = ref(null);
  const currentCardIndex = ref(0);
  const loading = ref(false);
  const error = ref(null);
  const dailyStats = ref(null);
  const isGlobalSession = ref(false);

  // Getters
  const currentCard = computed(() => {
    if (!sessionCards.value.length || currentCardIndex.value >= sessionCards.value.length) {
      return null;
    }
    return sessionCards.value[currentCardIndex.value];
  });

  const isSessionComplete = computed(() => {
    return sessionCards.value.length > 0 && currentCardIndex.value >= sessionCards.value.length;
  });

  const progress = computed(() => {
    return {
      current: currentCardIndex.value + 1,
      total: sessionCards.value.length,
    };
  });

  // Actions
  async function startSession(courseId) {
    loading.value = true;
    error.value = null;
    sessionCards.value = [];
    currentCardIndex.value = 0;
    sessionLimits.value = null;
    isGlobalSession.value = false;

    try {
      const data = await trainingApi.getDueCards(courseId, true);
      sessionCards.value = data.cards;
      sessionLimits.value = data.limits;
      if ((!sessionCards.value || !sessionCards.value.length) && data.message) throw new Error(data.message);
      return data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка запуска тренировки';
      console.error('[Training Store] Failed to start session:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function startGlobalSession() {
    loading.value = true;
    error.value = null;
    sessionCards.value = [];
    currentCardIndex.value = 0;
    sessionLimits.value = null;
    isGlobalSession.value = true;

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const data = await trainingApi.getGlobalDueCards(timezone);
      sessionCards.value = data.cards;
      sessionLimits.value = data.limits;
      return data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка запуска глобальной тренировки';
      console.error('[Training Store] Failed to start global session:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function submitReview(rating) {
    if (!currentCard.value) return;

    try {
      // Определяем часовой пояс пользователя
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await trainingApi.submitReview(currentCard.value.id, rating, timezone);

      // Обновляем локальные счетчики лимитов если они есть
      if (sessionLimits.value) {
        if (currentCard.value.state === 0) {
          // New card
          sessionLimits.value.newCardsRemaining = Math.max(0, sessionLimits.value.newCardsRemaining - 1);
          sessionLimits.value.globalNewRemaining = Math.max(0, sessionLimits.value.globalNewRemaining - 1);
        } else {
          sessionLimits.value.reviewsRemaining = Math.max(0, sessionLimits.value.reviewsRemaining - 1);
          sessionLimits.value.globalReviewsRemaining = Math.max(0, sessionLimits.value.globalReviewsRemaining - 1);
        }
      }

      currentCardIndex.value++;
    } catch (err) {
      console.error('[Training Store] Failed to submit review:', err);
      throw err;
    }
  }

  async function fetchDailyStats() {
    loading.value = true;
    try {
      dailyStats.value = await trainingApi.getStats();
      return dailyStats.value;
    } catch (err) {
      console.error('[Training Store] Failed to fetch stats:', err);
    } finally {
      loading.value = false;
    }
  }

  function resetSession() {
    sessionCards.value = [];
    sessionLimits.value = null;
    currentCardIndex.value = 0;
    error.value = null;
    isGlobalSession.value = false;
  }

  return {
    sessionCards,
    sessionLimits,
    currentCardIndex,
    loading,
    error,
    dailyStats,
    isGlobalSession,
    currentCard,
    isSessionComplete,
    progress,
    startSession,
    startGlobalSession,
    submitReview,
    fetchDailyStats,
    resetSession,
  };
});
