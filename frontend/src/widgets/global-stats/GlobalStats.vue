<script setup>
  import { onMounted } from 'vue'
  import { useStatsStore } from '@/entities/stats/model/useStatsStore'

  const statsStore = useStatsStore()

  onMounted(() => {
    statsStore.fetchGlobalStats()
  })

  function handleRetry() {
    statsStore.fetchGlobalStats()
  }
</script>

<template>
  <Card padding="lg">
    <h2 class="stats-title">Статистика</h2>

    <!-- Loading State -->
    <div
      v-if="statsStore.loading"
      class="loading-state">
      <div class="spinner" />
      <p>Загрузка статистики...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="statsStore.error"
      class="error-state">
      <p>{{ statsStore.error }}</p>
      <Button
        @click="handleRetry"
        variant="primary">
        Попробовать снова
      </Button>
    </div>

    <!-- Stats -->
    <div
      v-else
      class="stats-container">
      <!-- Новые карточки -->
      <StatItem
        icon="bookmark-plus"
        label="Новых карточек (всего)"
        :value="statsStore.totalNewCards" />

      <!-- Изучено/повторено сегодня -->
      <StatItem
        icon="check-circle"
        label="Изучено/повторено сегодня"
        :value="statsStore.studiedToday" />

      <!-- Осталось на сегодня -->
      <StatItem
        icon="hourglass-split"
        label="Осталось на сегодня"
        :value="statsStore.remainingToday" />

      <!-- Дневной лимит -->
      <StatItem
        icon="speedometer"
        label="Дневной лимит новых карточек"
        :value="statsStore.dailyNewLimit" />

      <!-- Количество тренировок -->
      <StatItem
        icon="lightning-charge"
        label="Тренировок сегодня"
        :value="statsStore.trainingsToday" />

      <!-- Placeholder для графика -->
      <div class="chart-placeholder">
        <p>График статистики (скоро)</p>
      </div>
    </div>
  </Card>
</template>

<style scoped>
  .stats-title {
    font-size: 24px;
    font-weight: bold;
    color: var(--color-text-primary);
    margin: 0 0 24px 0;
  }

  .stats-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 48px 24px;
  }

  .loading-state p,
  .error-state p {
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .chart-placeholder {
    margin-top: 24px;
    padding: 48px 24px;
    border: 2px dashed var(--color-border);
    border-radius: 8px;
    text-align: center;
  }

  .chart-placeholder p {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0;
  }
</style>
