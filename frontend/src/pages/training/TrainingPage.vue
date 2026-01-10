<script setup>
  import { ref, onMounted, computed, onUnmounted, useTemplateRef, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import { useTrainingStore } from '@/entities/training/model/useTrainingStore';
  import { useStatsStore } from '@/entities/stats/model/useStatsStore';
  import { useCourseStore } from '@/entities/course/model/useCourseStore';
  import { toast } from 'vue3-toastify';
  import useAutoFitText from '@/pages/training/composables/useAutoFitText.js';

  const route = useRoute();
  const router = useRouter();
  const isGlobalMode = route.params.id === 'global';
  const courseId = isGlobalMode ? null : parseInt(route.params.id);

  const trainingStore = useTrainingStore();
  const courseStore = useCourseStore();
  const statsStore = useStatsStore();
  const { currentCard, isSessionComplete, loading, sessionLimits, progress, isGlobalSession } =
    storeToRefs(trainingStore);

  // Состояние переворота карточки (локальное для UI)
  const isFlipped = ref(false);

  const frontContainerRef = useTemplateRef('frontContainer');
  const frontContentRef = useTemplateRef('frontContent');
  const backContainerRef = useTemplateRef('backContainer');
  const backContentRef = useTemplateRef('backContent');
  let currentSideFitter;

  // Получить название курса для текущей карточки
  const currentCourseName = computed(() => {
    if (!currentCard.value || !isGlobalSession.value) return null;
    const course = courseStore.courses.find((c) => c.id === currentCard.value.courseId);
    return course?.name || 'Неизвестный курс';
  });

  // Подсчитать оставшиеся карточки в сессии (новые и повторы)
  const sessionRemaining = computed(() => {
    const remainingCards = trainingStore.sessionCards.slice(trainingStore.currentCardIndex);
    const newCards = remainingCards.filter((c) => c.state === 0).length;
    const reviews = remainingCards.filter((c) => c.state !== 0).length;
    return { newCards, reviews };
  });

  const handleFlip = () => {
    if (currentSideFitter) {
      currentSideFitter.unlink();
      currentSideFitter = null;
    }
    isFlipped.value = !isFlipped.value;

    currentSideFitter = isFlipped.value
      ? useAutoFitText(backContainerRef, backContentRef, () => currentCard.value?.back)
      : useAutoFitText(frontContainerRef, frontContentRef, () => currentCard.value?.front);
  };

  const handleAnswer = async (ratingCode) => {
    isFlipped.value = false;
    if (currentSideFitter) {
      currentSideFitter.unlink();
      currentSideFitter = null;
    }
    currentSideFitter = useAutoFitText(frontContainerRef, frontContentRef, () => currentCard.value?.front);

    const ratingMap = {
      again: 1,
      hard: 2,
      good: 3,
      easy: 4,
    };

    const rating = ratingMap[ratingCode];
    if (!rating) return;

    try {
      await trainingStore.submitReview(rating);

      // Обновляем глобальную статистику
      await statsStore.fetchGlobalStats();

      if (isSessionComplete.value) {
        toast.success('Сессия завершена!');
      }
    } catch (error) {
      toast.error('Ошибка сохранения ответа');
    }
  };

  const handleBack = () => {
    if (isGlobalMode) router.push('/');
    else router.push(`/course/${courseId}`);
  };

  const handleContinue = async () => {
    // Попробовать получить еще карточки (новая сессия)
    try {
      if (isGlobalMode) {
        await trainingStore.startGlobalSession();
      } else {
        await trainingStore.startSession(courseId);
      }
      if (trainingStore.sessionCards.length === 0) {
        toast.info('На сегодня карточек больше нет');
        handleBack();
      }
    } catch (error) {
      toast.error('Ошибка продолжения тренировки');
    }
  };

  const stopWatch = watch(
    () => [frontContentRef.value, backContentRef.value],
    () => {
      if (frontContentRef.value && backContentRef.value) {
        console.log('%cГотово! Все в сборе:', 'color: lime', frontContentRef, backContentRef);
        currentSideFitter = useAutoFitText(frontContainerRef, frontContentRef, () => currentCard.value?.front);
        stopWatch();
      }
    }
  );

  onMounted(async () => {
    try {
      if (isGlobalMode) {
        await courseStore.fetchCourses();
        await trainingStore.startGlobalSession();
      } else {
        await trainingStore.startSession(courseId);
      }
    } catch (error) {
      toast.error('Не удалось запустить тренировку');
      if (isGlobalMode) await router.push('/');
      else await router.push(`/course/${courseId}`);
    }
  });

  onUnmounted(() => {
    trainingStore.resetSession();
    if (currentSideFitter) {
      currentSideFitter.unlink();
      currentSideFitter = null;
    }
  });
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
        v-if="!loading && !isSessionComplete"
        class="session-info">
        <div class="progress-text">Карточка {{ progress.current }} / {{ progress.total }}</div>
        <div class="limits-text">
          Осталось:
          <span
            class="badge new"
            v-if="sessionRemaining.newCards > 0">
            {{ sessionRemaining.newCards }} новых
          </span>
          <span
            class="badge review"
            v-if="sessionRemaining.reviews > 0">
            {{ sessionRemaining.reviews }} повтор.
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
            {{ isGlobalMode ? 'Вернуться на главную' : 'Вернуться к курсу' }}
          </Button>
        </div>
      </div>
    </div>

    <div
      v-else-if="currentCard"
      class="training-container perspective-distant group"
      :class="{ flipped: isFlipped }">
      <Card
        padding="lg"
        class="card training-card w-full flex flex-col relative z-20 border border-white/10 transition-all duration-700 transform-3d"
        @click="handleFlip">
        <div
          class="training-card__content w-full flex flex-col flex-grow relative items-center justify-start transform-3d">
          <div
            ref="frontContainer"
            data-ref="frontContainer"
            class="card-front w-full absolute inset-0 backface-hidden flex flex-col items-center justify-center z-20">
            <div class="card-label shrink-0">ВОПРОС</div>

            <div
              ref="frontContent"
              data-ref="frontContent"
              class="flex-1 w-full overflow-y-auto overflow-x-hidden relative flex items-center justify-center"
              v-html="currentCard.front" />
          </div>

          <div
            ref="backContainer"
            data-ref="backContainer"
            class="card-back w-full absolute inset-0 backface-hidden flex flex-col items-center justify-center rotate-y-180">
            <div class="card-label shrink-0">ОТВЕТ</div>

            <div
              ref="backContent"
              data-ref="backContent"
              class="flex-1 w-full overflow-y-auto overflow-x-hidden relative flex items-center justify-center"
              v-html="currentCard.back" />
          </div>
        </div>
        <div class="card-footer">
          <i class="bi bi-arrow-repeat" />
          Нажмите, чтобы {{ isFlipped ? 'вернуть' : 'перевернуть' }}
        </div>
      </Card>

      <!-- Course Badge для глобального режима -->
      <div
        v-if="isGlobalSession"
        class="course-badge-container">
        <CourseBadge :course-name="currentCourseName" />
      </div>

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
    width: clamp(50vw, 800px, 97vw);
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
    perspective: 1000px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .training-card {
    cursor: pointer;
    min-height: calc(100dvh - 280px);
    max-height: calc(100dvh - 280px);
  }

  .training-container.flipped .training-card,
  .training-container.flipped .card-footer {
    transform: rotateY(180deg);
  }

  .training-card__content {
    padding: 0 20px;
    line-height: 1.25;
  }

  .card-label {
    font-size: var(--text-body-sm-size);
    font-weight: 600;
    color: var(--color-text-placeholder);
    letter-spacing: 1px;
    margin-bottom: 20px;
  }

  .card-text {
    color: var(--color-text-hilight);
    transition: font-size 0.1s linear; /* Чтобы не "мигало" слишком резко при ресайзе */
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-top: 20px;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    font-size: 13px;
    color: var(--color-text-hint);
  }

  .card-footer i {
    font-size: 16px;
  }

  .course-badge-container {
    display: flex;
    justify-content: center;
    margin-top: -12px;
  }
</style>
