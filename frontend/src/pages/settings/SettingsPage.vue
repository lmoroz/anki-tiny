<script setup>
import { ref, onMounted } from 'vue';
import Card from '@/shared/ui/Card.vue';
import Input from '@/shared/ui/Input.vue';
import Button from '@/shared/ui/Button.vue';

const settings = ref({
  trainingStartHour: 8,
  trainingEndHour: 22,
  minTimeBeforeEnd: 4
});

const isLoading = ref(true);
const isSaving = ref(false);

onMounted(() => {
  // TODO: Загрузка настроек из API
  setTimeout(() => {
    isLoading.value = false;
  }, 300);
});

const handleSave = async () => {
  isSaving.value = true;
  // TODO: Сохранение настроек в API
  setTimeout(() => {
    isSaving.value = false;
    console.log('Settings saved:', settings.value);
  }, 500);
};
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Настройки</h1>
      <p class="page-subtitle">Глобальные параметры приложения</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"/>
    </div>

    <div v-else class="settings-content">
      <Card padding="lg">
        <h2 class="section-title">Время тренировок</h2>
        <p class="section-description">
          Настройте временные рамки, в которые приложение будет предлагать новые карточки
        </p>

        <div class="settings-group">
          <Input
            v-model="settings.trainingStartHour"
            type="number"
            label="Начало дня (час)"
            placeholder="8"
          />
          <Input
            v-model="settings.trainingEndHour"
            type="number"
            label="Конец дня (час)"
            placeholder="22"
          />
        </div>

        <div class="info-box">
          <i class="bi bi-info-circle"/>
          <p>
            Приложение не будет предлагать новые карточки, если до конца дня осталось меньше 
            {{ settings.minTimeBeforeEnd }} часов (первый интервал повторения)
          </p>
        </div>
      </Card>

      <Card padding="lg" class="settings-section">
        <h2 class="section-title">Интервальное повторение</h2>
        <p class="section-description">
          Параметры алгоритма запоминания (можно переопределить для каждого курса)
        </p>

        <div class="info-box">
          <i class="bi bi-info-circle"/>
          <p>
            Настройки алгоритма будут доступны в следующей версии
          </p>
        </div>
      </Card>

      <div class="settings-actions">
        <Button @click="handleSave" variant="primary" size="lg" :disabled="isSaving">
          <i class="bi bi-check-lg"/>
          {{ isSaving ? 'Сохранение...' : 'Сохранить настройки' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 15px;
  color: #94a3b8;
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

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  margin-top: 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.section-description {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 24px;
}

.settings-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.info-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: #93c5fd;
  line-height: 1.5;
}

.info-box i {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}
</style>
