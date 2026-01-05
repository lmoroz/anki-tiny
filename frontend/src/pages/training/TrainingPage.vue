<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/shared/ui/Card.vue';
import Button from '@/shared/ui/Button.vue';

const route = useRoute();
const router = useRouter();
const courseId = route.params.id;
const currentCard = ref(null);
const isFlipped = ref(false);
const isLoading = ref(true);

onMounted(() => {
  // TODO: Загрузка карточки для повторения
  setTimeout(() => {
    currentCard.value = {
      front: 'Пример лицевой стороны',
      back: 'Пример обратной стороны'
    };
    isLoading.value = false;
  }, 300);
});

const handleFlip = () => {
  isFlipped.value = !isFlipped.value;
};

const handleAnswer = (difficulty) => {
  console.log('Answer:', difficulty);
  // TODO: Отправка результата, загрузка следующей карточки
  isFlipped.value = false;
};

const handleBack = () => {
  router.push(`/course/${courseId}`);
};
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <Button @click="handleBack" variant="ghost" size="sm">
        <i class="bi bi-arrow-left"/>
        Завершить
      </Button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"/>
    </div>

    <div v-else class="training-container">
      <Card padding="lg" class="training-card" @click="handleFlip">
        <div class="card-content">
          <div v-if="!isFlipped" class="card-front">
            <div class="card-label">ВОПРОС</div>
            <div class="card-text">{{ currentCard.front }}</div>
          </div>
          <div v-else class="card-back">
            <div class="card-label">ОТВЕТ</div>
            <div class="card-text">{{ currentCard.back }}</div>
          </div>
        </div>
        <div class="flip-hint">
          <i class="bi bi-arrow-repeat"/>
          Нажмите, чтобы {{ isFlipped ? 'вернуть' : 'перевернуть' }}
        </div>
      </Card>

      <div v-if="isFlipped" class="answer-buttons">
        <Button @click="handleAnswer('again')" variant="danger" size="lg">
          Снова
        </Button>
        <Button @click="handleAnswer('hard')" variant="secondary" size="lg">
          Сложно
        </Button>
        <Button @click="handleAnswer('good')" variant="primary" size="lg">
          Хорошо
        </Button>
        <Button @click="handleAnswer('easy')" variant="primary" size="lg">
          Легко
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
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
  to { transform: rotate(360deg); }
}

.training-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.training-card {
  cursor: pointer;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.card-content {
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

.card-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

.card-text {
  font-size: 24px;
  font-weight: 500;
  color: #f1f5f9;
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
  color: #64748b;
}

.flip-hint i {
  font-size: 16px;
}

.answer-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
</style>
