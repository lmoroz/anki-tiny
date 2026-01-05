<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/shared/ui/Card.vue';
import Button from '@/shared/ui/Button.vue';

const route = useRoute();
const router = useRouter();
const courseId = route.params.id;
const course = ref(null);
const isLoading = ref(true);

onMounted(() => {
  // TODO: Загрузка данных курса из API
  setTimeout(() => {
    course.value = {
      id: courseId,
      name: 'Название курса',
      description: 'Описание курса',
      cardsCount: 0
    };
    isLoading.value = false;
  }, 300);
});

const handleBack = () => {
  router.push('/');
};

const handleStartTraining = () => {
  router.push(`/training/${courseId}`);
};
</script>

<template>
  <div class="page-container">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"/>
    </div>

    <div v-else>
      <div class="page-header">
        <Button @click="handleBack" variant="ghost" size="sm">
          <i class="bi bi-arrow-left"/>
          Назад
        </Button>
      </div>

      <Card padding="lg">
        <h1 class="course-title">{{ course.name }}</h1>
        <p class="course-description">{{ course.description }}</p>
        
        <div class="course-stats">
          <div class="stat-item">
            <i class="bi bi-card-list"/>
            <span>{{ course.cardsCount }} карточек</span>
          </div>
        </div>

        <div class="course-actions">
          <Button @click="handleStartTraining" variant="primary" size="lg" full-width>
            <i class="bi bi-play-fill"/>
            Начать тренировку
          </Button>
        </div>
      </Card>

      <div class="cards-section">
        <h2 class="section-title">Карточки</h2>
        <!-- TODO: Список карточек -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
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

.page-header {
  margin-bottom: 20px;
}

.course-title {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.course-description {
  font-size: 15px;
  color: #94a3b8;
  margin-bottom: 24px;
}

.course-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #cbd5e1;
}

.stat-item i {
  font-size: 16px;
  color: #3b82f6;
}

.course-actions {
  padding-top: 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.cards-section {
  margin-top: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 16px;
}
</style>
