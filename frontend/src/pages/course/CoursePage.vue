<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore } from '@/entities/course/model/useCourseStore'
import { useCardStore } from '@/entities/card/model/useCardStore'
import Card from '@/shared/ui/Card.vue'
import Button from '@/shared/ui/Button.vue'
import CardList from '@/widgets/card-list/CardList.vue'
import CardEditorModal from '@/widgets/card-editor/CardEditorModal.vue'
import QuickAddCard from '@/widgets/quick-add-card/QuickAddCard.vue'

const route = useRoute()
const router = useRouter()
const courseId = parseInt(route.params.id, 10)

const courseStore = useCourseStore()
const cardStore = useCardStore()

const isLoading = ref(true)
const showEditorModal = ref(false)
const editingCard = ref(null)

// Computed
const course = computed(() => courseStore.getCourseById(courseId))
const cards = computed(() => cardStore.getCardsByCourse(courseId))
const stats = computed(() => cardStore.getCourseStats(courseId))
const cardsLoading = computed(() => cardStore.loading)

onMounted(async () => {
  try {
    // Загружаем данные курса если его нет в store
    if (!course.value) {
      await courseStore.fetchCourses()
    }
    
    // Загружаем карточки курса
    await Promise.all([
      cardStore.fetchCardsByCourse(courseId),
      cardStore.fetchCourseStats(courseId)
    ])
  } catch (err) {
    console.error('Failed to load course data:', err)
  } finally {
    isLoading.value = false
  }
})

const handleBack = () => {
  router.push('/')
}

const handleStartTraining = () => {
  router.push(`/training/${courseId}`)
}

const handleQuickAdd = async (cardData) => {
  try {
    await cardStore.createCard(courseId, cardData)
  } catch (err) {
    console.error('Failed to create card:', err)
  }
}

const handleEditCard = (card) => {
  editingCard.value = card
  showEditorModal.value = true
}

const handleDeleteCard = async (card) => {
  const confirmed = confirm(`Удалить карточку?\n\nВопрос: ${card.front.substring(0, 50)}${card.front.length > 50 ? '...' : ''}`)
  
  if (confirmed) {
    try {
      await cardStore.deleteCard(card.id, courseId)
    } catch (err) {
      console.error('Failed to delete card:', err)
    }
  }
}

const handleSaveCard = async (data) => {
  try {
    if (editingCard.value) {
      // Режим редактирования
      await cardStore.updateCard(editingCard.value.id, data)
    } else {
      // Режим создания
      await cardStore.createCard(courseId, data)
    }
    handleCloseModal()
  } catch (err) {
    console.error('Failed to save card:', err)
  }
}

const handleCloseModal = () => {
  showEditorModal.value = false
  editingCard.value = null
}

const handleCreateCard = () => {
  editingCard.value = null
  showEditorModal.value = true
}
</script>

<template>
  <div class="page-container">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner" />
    </div>

    <div v-else>
      <div class="page-header">
        <Button @click="handleBack" variant="ghost" size="sm">
          <i class="bi bi-arrow-left" />
          Назад
        </Button>
      </div>

      <Card padding="lg">
        <h1 class="course-title">{{ course?.name }}</h1>
        <p class="course-description">{{ course?.description }}</p>
        
        <div class="course-stats">
          <div v-if="stats" class="stats-grid">
            <div class="stat-item">
              <i class="bi bi-card-list" />
              <div class="stat-content">
                <span class="stat-value">{{ stats.total }}</span>
                <span class="stat-label">Всего карточек</span>
              </div>
            </div>
            <div class="stat-item">
              <i class="bi bi-stars" />
              <div class="stat-content">
                <span class="stat-value">{{ stats.new }}</span>
                <span class="stat-label">Новых</span>
              </div>
            </div>
            <div class="stat-item">
              <i class="bi bi-arrow-repeat" />
              <div class="stat-content">
                <span class="stat-value">{{ stats.review }}</span>
                <span class="stat-label">На повторении</span>
              </div>
            </div>
            <div class="stat-item highlight">
              <i class="bi bi-calendar-check" />
              <div class="stat-content">
                <span class="stat-value">{{ stats.dueToday }}</span>
                <span class="stat-label">Сегодня</span>
              </div>
            </div>
          </div>
        </div>

        <div class="course-actions">
          <Button
            @click="handleStartTraining"
            variant="primary"
            size="lg"
            full-width
            :disabled="!stats || stats.dueToday === 0"
          >
            <i class="bi bi-play-fill" />
            {{ stats && stats.dueToday > 0 ? `Начать тренировку (${stats.dueToday})` : 'Нет карточек для повторения' }}
          </Button>
        </div>
      </Card>

      <div class="cards-section">
        <div class="section-header">
          <h2 class="section-title">Карточки</h2>
          <Button @click="handleCreateCard" variant="secondary" size="sm">
            <i class="bi bi-plus-lg" />
            Создать карточку
          </Button>
        </div>

        <QuickAddCard :course-id="courseId" @added="handleQuickAdd" />

        <CardList
          :cards="cards"
          :loading="cardsLoading"
          @edit="handleEditCard"
          @delete="handleDeleteCard"
        />
      </div>
    </div>

    <CardEditorModal
      v-if="showEditorModal"
      :card="editingCard"
      :course-id="courseId"
      @close="handleCloseModal"
      @save="handleSaveCard"
    />
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
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(15, 23, 42, 0.6);
}

.stat-item.highlight {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1));
  border-color: rgba(59, 130, 246, 0.3);
}

.stat-item i {
  font-size: 24px;
  color: #3b82f6;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
}

.course-actions {
  padding-top: 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.cards-section {
  margin-top: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}
</style>
