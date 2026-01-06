<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import MarkdownIt from 'markdown-it'
  import hljs from 'highlight.js'
  import { useCourseStore } from '@/entities/course/model/useCourseStore'
  import { useCardStore } from '@/entities/card/model/useCardStore'

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

  // Инициализация парсера Markdown с настройкой подсветки
  const md = new MarkdownIt({
    html: true, // Разрешаем HTML теги в исходном тексте
    linkify: true, // Автоматическое преобразование ссылок
    typographer: true, // Улучшение типографики
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value
        } catch (__) {}
      }
      return '' // Использовать стандартное экранирование, если язык не найден
    }
  })

  // Преобразуем markdown-текст вопроса в HTML
  const parsedDescription = computed(() => {
    if (!course.value?.description) return ''
    return md.render(course.value?.description)
  })

  onMounted(async () => {
    try {
      // Загружаем данные курса если его нет в store
      if (!course.value) await courseStore.fetchCourses()

      // Загружаем карточки курса
      await Promise.all([cardStore.fetchCardsByCourse(courseId), cardStore.fetchCourseStats(courseId)])
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

  const handleQuickAdd = async cardData => {
    try {
      await cardStore.createCard(courseId, cardData)
    } catch (err) {
      console.error('Failed to create card:', err)
    }
  }

  const handleEditCard = card => {
    editingCard.value = card
    showEditorModal.value = true
  }

  const handleDeleteCard = async card => {
    const confirmed = confirm(`Удалить карточку?\n\nВопрос: ${card.front.substring(0, 50)}${card.front.length > 50 ? '...' : ''}`)

    if (confirmed) {
      try {
        await cardStore.deleteCard(card.id, courseId)
      } catch (err) {
        console.error('Failed to delete card:', err)
      }
    }
  }

  const handleSaveCard = async data => {
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
    <div
      v-if="isLoading"
      class="loading-state">
      <div class="spinner" />
    </div>

    <div v-else>
      <div class="page-header">
        <Button
          @click="handleBack"
          variant="ghost"
          size="sm">
          <i class="bi bi-arrow-left" />
          Назад
        </Button>
      </div>

      <Card
        padding="lg"
        class="mb-16">
        <h1 class="course-title text-3xl font-bold text-white leading-tight tracking-tight drop-shadow-sm">{{ course?.name }}</h1>
        <div
          class="course-description rounded-[12px] p-3 text-gray-100 leading-relaxed shadow-xl bg-gray-500/20 border border-white/30 backdrop-blur-md bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15)_0%,transparent_50%)]"
          v-html="parsedDescription" />

        <div class="course-stats">
          <div
            v-if="stats"
            class="stats-grid">
            <Card
              rounded="10px"
              padding="sm">
              <div class="stat-item">
                <i class="bi bi-card-list" />
                <div class="stat-content">
                  <span class="stat-value">{{ stats.total }}</span>
                  <span class="stat-label">Всего карточек</span>
                </div>
              </div>
            </Card>
            <Card
              rounded="10px"
              padding="sm">
              <div class="stat-item">
                <i class="bi bi-stars" />
                <div class="stat-content">
                  <span class="stat-value">{{ stats.newCards }}</span>
                  <span class="stat-label">Новых</span>
                </div>
              </div>
            </Card>
            <Card
              rounded="10px"
              padding="sm">
              <div class="stat-item">
                <i class="bi bi-arrow-repeat" />
                <div class="stat-content">
                  <span class="stat-value">{{ stats.reviewCards }}</span>
                  <span class="stat-label">На повторении</span>
                </div>
              </div>
            </Card>
            <Card
              rounded="10px"
              padding="sm"
              highlight>
              <div class="stat-item highlight">
                <i class="bi bi-calendar-check" />
                <div class="stat-content">
                  <span class="stat-value">{{ stats.dueToday }}</span>
                  <span class="stat-label">Сегодня</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div class="course-actions">
          <Button
            @click="handleStartTraining"
            size="lg"
            full-width
            :disabled="!stats || stats.dueToday === 0">
            <span class="text-lg font-semibold text-white drop-shadow-md tracking-wide">
              <i class="bi bi-play-fill" />
              {{ stats && stats.dueToday > 0 ? `Начать тренировку (${stats.dueToday})` : 'Нет карточек для повторения' }}
            </span>
          </Button>
        </div>
      </Card>

      <div class="cards-section">
        <div class="section-header">
          <h2 class="section-title">Карточки</h2>
          <Button
            @click="handleCreateCard"
            variant="secondary"
            size="sm">
            <i class="bi bi-plus-lg" />
            Создать карточку
          </Button>
        </div>

        <QuickAddCard
          :course-id="courseId"
          @added="handleQuickAdd" />

        <CardList
          :cards="cards"
          :loading="cardsLoading"
          @edit="handleEditCard"
          @delete="handleDeleteCard" />
      </div>
    </div>

    <CardEditorModal
      v-if="showEditorModal"
      :card="editingCard"
      :course-id="courseId"
      @close="handleCloseModal"
      @save="handleSaveCard" />
  </div>
</template>

<style scoped>
  .page-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  .loading-state {
    display: flex;
    justify-content: center;
    padding: 80px 20px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e8eaed;
    border-top-color: #1a73e8;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .page-header {
    margin-bottom: 20px;
  }

  .course-title {
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .course-description {
    font-size: 15px;
    color: #e9ecefcc;
    margin-bottom: 24px;
    line-height: 1.6;
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
  }

  .stat-item i {
    font-size: 24px;
    color: #ffffff;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: #ffffffcc;
  }

  .course-actions {
    padding-top: 24px;
    border-top: 1px solid #e9ecef;
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
    color: #e9ecef;
    margin: 0;
  }
</style>
