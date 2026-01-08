import { defineStore } from 'pinia'
import { ref } from 'vue'
import { statsApi } from '@/shared/api/stats'
import { trainingApi } from '@/shared/api/training'

export const useStatsStore = defineStore('stats', () => {
  // State
  const totalNewCards = ref(0)
  const studiedToday = ref(0)
  const remainingToday = ref(0)
  const dailyNewLimit = ref(0)
  const trainingsToday = ref(0)
  const loading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchGlobalStats() {
    loading.value = true
    error.value = null

    try {
      // 1. Получить статистику за день
      const dailyStats = await trainingApi.getStats()

      // 2. Получить общее количество новых карточек
      const globalStats = await statsApi.getGlobalStats()

      // 3. Рассчитать метрики
      totalNewCards.value = globalStats.totalNewCards

      studiedToday.value =
        dailyStats.global.newCardsStudied + dailyStats.global.reviewsCompleted

      trainingsToday.value = studiedToday.value

      // Remaining = globalNewRemaining + globalReviewsRemaining
      remainingToday.value =
        dailyStats.global.limits.globalNewCardsPerDay -
        dailyStats.global.newCardsStudied +
        (dailyStats.global.limits.globalMaxReviewsPerDay -
          dailyStats.global.reviewsCompleted)

      dailyNewLimit.value = dailyStats.global.limits.globalNewCardsPerDay
    }
    catch (err) {
      error.value = 'Failed to load statistics'
      console.error('[Stats Store] Failed to fetch global stats:', err)
    }
    finally {
      loading.value = false
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
    fetchGlobalStats
  }
})
