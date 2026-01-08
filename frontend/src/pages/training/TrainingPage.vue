<script setup>
  import { onMounted, computed, onUnmounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import { useTrainingStore } from '@/entities/training/model/useTrainingStore'
  import { toast } from 'vue3-toastify'

  const route = useRoute()
  const router = useRouter()
  const courseId = parseInt(route.params.id)

  const trainingStore = useTrainingStore()
  const { currentCard, isSessionComplete, loading, sessionLimits, progress } = storeToRefs(trainingStore)

  // Состояние переворота карточки (локальное для UI)
  import { ref } from 'vue'

  const isFlipped = ref(false)

  onMounted(async () => {
    try {
      await trainingStore.startSession(courseId)
    } catch (error) {
      toast.error('Не удалось запустить тренировку')
      router.push(`/course/${courseId}`)
    }
  })

  onUnmounted(() => {
    trainingStore.resetSession()
  })

  const handleFlip = () => {
    isFlipped.value = !isFlipped.value
  }

  const handleAnswer = async ratingCode => {
    const ratingMap = {
      again: 1,
      hard: 2,
      good: 3,
      easy: 4
    }

    const rating = ratingMap[ratingCode]
    if (!rating) return

    try {
      await trainingStore.submitReview(rating)
      isFlipped.value = false

      if (isSessionComplete.value) {
        toast.success('Сессия завершена!')
      }
    } catch (error) {
      toast.error('Ошибка сохранения ответа')
    }
  }

  const handleBack = () => {
    router.push(`/course/${courseId}`)
  }

  const handleContinue = async () => {
    // Попробовать получить еще карточки (новая сессия)
    try {
      await trainingStore.startSession(courseId)
      if (trainingStore.sessionCards.length === 0) {
        toast.info('На сегодня карточек больше нет')
        router.push(`/course/${courseId}`)
      }
    } catch (error) {
      toast.error('Ошибка продолжения тренировки')
    }
  }
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <Button
        @click="handleBack"
        variant="ghost"
        size="sm">
        <i class="bi bi-arrow-left" />
        {{ isSessionComplete ? 'Выйти' : 'Завершить' }}
      </Button>

      <!-- Информация о сессии -->
      <div
        v-if="!loading && sessionLimits && !isSessionComplete"
        class="session-info">
        <div class="progress-text">Карточка {{ progress.current }} / {{ progress.total }}</div>
        <div class="limits-text">
          Осталось:
          <span
            class="badge new"
            v-if="sessionLimits.newCardsRemaining > 0">
            {{ sessionLimits.newCardsRemaining }} новых
          </span>
          <span
            class="badge review"
            v-if="sessionLimits.reviewsRemaining > 0">
            {{ sessionLimits.reviewsRemaining }} повтор.
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading-state">
      <div class="spinner" />
    </div>

    <div
      v-else-if="isSessionComplete"
      class="complete-state">
      <div class="complete-content">
        <i class="bi bi-check-circle-fill success-icon" />
        <h2>Сессия завершена!</h2>
        <p>Вы отлично поработали.</p>

        <div class="action-buttons">
          <Button
            @click="handleContinue"
            variant="primary">
            Продолжить тренировку
          </Button>
          <Button
            @click="handleBack"
            variant="secondary">
            Вернуться к курсу
          </Button>
        </div>
      </div>
    </div>

    <div
      v-else-if="currentCard"
      class="training-container">
      <Card
        padding="lg"
        class="training-card"
        :class="{ flipped: isFlipped }"
        @click="handleFlip">
        <div class="training-card__content flex-1">
          <div class="card-front">
            <div class="card-label">ВОПРОС</div>
            <div class="card-text">{{ currentCard.front }}</div>
          </div>
          <div class="card-back">
            <div class="card-label">ОТВЕТ</div>
            <div class="card-text">{{ currentCard.back }}</div>
          </div>
        </div>
        <div class="flip-hint mt-auto">
          <i class="bi bi-arrow-repeat" />
          Нажмите, чтобы {{ isFlipped ? 'вернуть' : 'перевернуть' }}
        </div>
      </Card>

      <div
        v-if="isFlipped"
        class="answer-buttons flex items-center justify-center gap-5">
        <Button
          @click="handleAnswer('again')"
          variant="danger"
          size="lg">
          Снова
        </Button>
        <Button
          @click="handleAnswer('hard')"
          variant="secondary"
          size="lg">
          Сложно
        </Button>
        <Button
          @click="handleAnswer('good')"
          size="lg">
          Хорошо
        </Button>
        <Button
          @click="handleAnswer('easy')"
          variant="success"
          size="lg">
          Легко
        </Button>
      </div>
    </div>

    <div
      v-else
      class="empty-state">
      <p>Нет карточек для повторения.</p>
      <Button @click="handleBack">Вернуться назад</Button>
    </div>
  </div>
</template>

<style scoped>
  .page-container {
    max-width: 800px;
    width: 90%;
    margin: 0 auto;
    padding: 24px;
  }

  .page-header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .session-info {
    text-align: right;
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .limits-text {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .badge.new {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .badge.review {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .loading-state {
    display: flex;
    justify-content: center;
    padding: 80px 20px;
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
    to {
      transform: rotate(360deg);
    }
  }

  .complete-state {
    display: flex;
    justify-content: center;
    padding: 40px 0;
    text-align: center;
  }

  .complete-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .success-icon {
    font-size: 48px;
    color: var(--color-success);
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  .training-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .training-card {
    perspective: 1000px;
    cursor: pointer;
    min-height: 400px;
    transition:
      transform 0.6s,
      opacity 0.2s ease;
    transform-style: preserve-3d;
  }

  .training-card.flipped {
    transform: rotateY(180deg);
  }

  .training-card__content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  .card-front,
  .card-back {
    text-align: center;
    width: 100%;
  }

  .card-back {
    transform: rotateY(180deg);
    display: none;
  }

  .training-card.flipped .card-front {
    display: none;
  }

  .training-card.flipped .card-back {
    display: block;
  }

  .training-card.flipped .flip-hint {
    transform: rotateY(180deg);
  }

  .card-label {
    font-size: var(--text-body-sm-size);
    font-weight: 600;
    color: var(--color-text-placeholder);
    letter-spacing: 1px;
    margin-bottom: 20px;
  }

  .card-text {
    font-size: var(--text-hero-size);
    font-weight: 500;
    color: var(--color-text-hilight);
    line-height: 1.5;
  }

  .flip-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-top: 20px;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    font-size: 13px;
    color: var(--color-text-hint);
  }

  .flip-hint i {
    font-size: 16px;
  }
</style>
