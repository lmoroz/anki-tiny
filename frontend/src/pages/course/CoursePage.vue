<script setup>
  import { ref, onMounted, computed, onUnmounted, watch, nextTick, useTemplateRef } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useMediaQuery } from '@vueuse/core'
  import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
  import MarkdownIt from 'markdown-it'
  import hljs from 'highlight.js'
  import { useConfirm } from '@/shared/lib/useConfirm'
  import { useCourseStore } from '@/entities/course/model/useCourseStore'
  import { useCardStore } from '@/entities/card/model/useCardStore'
  import { toast } from 'vue3-toastify'

  const route = useRoute()
  const router = useRouter()
  const courseId = parseInt(route.params.id, 10)

  const courseStore = useCourseStore()
  const cardStore = useCardStore()

  const isLoading = ref(true)
  const showEditorModal = ref(false)
  const editingCard = ref(null)
  const showSettingsModal = ref(false)
  const quickAddCardRef = ref(null)
  const cardListDesktopRef = ref(null)
  const cardListMobileRef = ref(null)

  // Responsive layout state
  const isDesktop = useMediaQuery('(min-width: 1025px)')
  const isCardsPanelOpen = ref(false)
  const cardsPanelRef = useTemplateRef('cardsPanel')
  let focusTrap

  // Selection Mode State
  const isSelectionMode = ref(false)
  const selectedCardIds = ref(new Set())

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

  const handleKeydown = e => {
    if (e.key === 'Escape' && isCardsPanelOpen.value) {
      closeCardsPanel()
    }
  }

  onMounted(async () => {
    try {
      // Загружаем данные курса если его нет в store
      if (!course.value) await courseStore.fetchCourses()

      // Загружаем карточки курса
      await Promise.all([cardStore.fetchCardsByCourse(courseId), cardStore.fetchCourseStats(courseId)])
    } catch (err) {
      console.error('Failed to load course data:', err)
      toast.error('Ошибка загрузки: ' + err.message)
    } finally {
      isLoading.value = false
    }

    // Add keyboard listener for panel
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
    if (focusTrap) {
      focusTrap.deactivate()
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
      const newCard = await cardStore.createCard(courseId, cardData)
      toast.success('Карточка создана!')
      nextTick(() => scrollToCardWithBounce(newCard.id))
    } catch (err) {
      console.error('Failed to create card:', err)
      toast.error('Ошибка создания: ' + err.message)
    }
  }

  const handleEditCard = card => {
    editingCard.value = card
    showEditorModal.value = true
  }

  const handleDeleteCard = async card => {
    const { confirm } = useConfirm()
    const confirmed = await confirm('Удалить карточку?')

    if (confirmed) {
      try {
        await cardStore.deleteCard(card.id, courseId)
        toast.success('Карточка удалена!')
      } catch (err) {
        console.error('Failed to delete card:', err)
        toast.error('Ошибка удаления: ' + err.message)
      }
    }
  }

  const handleToggleCardSelection = card => {
    if (selectedCardIds.value.has(card.id)) {
      selectedCardIds.value.delete(card.id)
    } else {
      selectedCardIds.value.add(card.id)
    }
    // Force reactivity
    selectedCardIds.value = new Set(selectedCardIds.value)
  }

  const handleBatchDelete = async () => {
    const { confirm } = useConfirm()
    const count = selectedCardIds.value.size
    const confirmed = await confirm({
      title: 'Удаление карточек',
      message: `Удалить выбранные карточки (${count})?`,
    })

    if (confirmed) {
      try {
        await cardStore.deleteBatchCards(Array.from(selectedCardIds.value), courseId)
        toast.success('Карточки удалены!')
        exitSelectionMode()
      } catch (err) {
        console.error('Failed to batch delete cards:', err)
        toast.error('Ошибка удаления: ' + err.message)
      }
    }
  }

  const handleDeleteAllCards = async () => {
    const { confirm } = useConfirm()
    const count = cards.value.length
    const confirmed = await confirm({
      title: 'Удаление всех карточек',
      message: `Вы уверены, что хотите удалить ВСЕ карточки курса (${count})?\n\nЭто действие необратимо!`,
      confirmText: 'Удалить все',
      cancelText: 'Отмена'
    })

    if (confirmed) {
      try {
        await cardStore.deleteAllCards(courseId)
        toast.success('Все карточки удалены!')
      } catch (err) {
        console.error('Failed to delete all cards:', err)
        toast.error('Ошибка удаления: ' + err.message)
      }
    }
  }

  const exitSelectionMode = () => {
    isSelectionMode.value = false
    selectedCardIds.value.clear()
  }

  const handleSaveCard = async data => {
    try {
      if (editingCard.value) {
        // Режим редактирования
        await cardStore.updateCard(editingCard.value.id, { ...data, resetProgress: true })
        toast.success('Карточка обновлена!')
        const editedCardId = editingCard.value.id

        // Обновляем список карточек
        await cardStore.fetchCardsByCourse(courseId)
        handleCloseModal()

        // Прокручиваем к отредактированной карточке с анимацией
        nextTick(() => {
          scrollToCardWithBounce(editedCardId)
        })
      } else {
        // Режим создания
        const newCard = await cardStore.createCard(courseId, data)
        toast.success('Карточка создана!')
        handleCloseModal()

        nextTick(() => {
          scrollToCardWithBounce(newCard.id)
        })
      }
    } catch (err) {
      console.error('Failed to save card:', err)
      toast.error('Ошибка сохранения: ' + err.message)
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

  const handleOpenSettings = () => {
    showSettingsModal.value = true
  }

  const handleCloseSettings = () => {
    showSettingsModal.value = false
  }

  const handleSettingsSaved = () => {
    console.log('Settings saved for course:', courseId)
  }

  // MobilePanel controls
  const openCardsPanel = () => {
    isCardsPanelOpen.value = true
    document.body.style.overflow = 'hidden'
  }

  const closeCardsPanel = () => {
    isCardsPanelOpen.value = false
    document.body.style.overflow = ''
  }

  const scrollToCardWithBounce = async cardId => {
    if (!isDesktop.value && !isCardsPanelOpen.value) openCardsPanel()
    await nextTick()
    const cardListComponent = isDesktop.value ? cardListDesktopRef.value : cardListMobileRef.value
    if (cardListComponent) cardListComponent.scrollToCardWithBounce(cardId)
  }

  // Watchers
  watch(isCardsPanelOpen, async isOpen => {
    if (isOpen && !isDesktop.value) {
      await nextTick()
      if (cardsPanelRef.value) {
        focusTrap = useFocusTrap(cardsPanelRef, {
          clickOutsideDeactivates: true,
          escapeDeactivates: false, // We handle Escape manually in handleKeydown
          fallbackFocus: '.panel-close-btn'
        })
        focusTrap.activate()
      }
    } else {
      if (focusTrap) {
        focusTrap.deactivate()
        focusTrap = null
      }
    }
  })
</script>

<template>
  <div class="page-container">
    <div
      v-if="isLoading"
      class="loading-state">
      <div class="spinner" />
    </div>

    <div v-else>
      <div class="flex items-center justify-between mb-2">
        <Button
          size="sm"
          variant="ghost"
          @click="handleBack">
          <i class="bi bi-arrow-left" />
          Назад
        </Button>
        <Button
          size="sm"
          variant="ghost"
          @click="handleOpenSettings">
          <i class="bi bi-gear" />
          Настройки курса
        </Button>
      </div>

      <!-- Responsive Grid Layout -->
      <div class="course-page-grid">
        <!-- Left Column / Full Width on Mobile: Course Info -->
        <div class="course-info-section">
          <Card
            class="mb-6"
            padding="lg">
            <h1 class="course-title lg:mb-2 md:mb-1 sm:mb-1 text-3xl font-bold text-white leading-tight tracking-tight drop-shadow-sm">{{ course?.name }}</h1>
            <div
              v-if="course?.description"
              class="course-description lg:mb-2 md:mb-1 sm:mb-1 rounded-[12px] p-3 text-gray-100 leading-relaxed shadow-xl bg-gray-500/20 border border-white/30 backdrop-blur-md bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15)_0%,transparent_50%)]"
              v-html="parsedDescription" />

            <div class="course-stats lg:mb-2 md:mb-1 sm:mb-1">
              <div
                v-if="stats"
                class="stats-grid">
                <Card
                  padding="sm"
                  rounded="md">
                  <div class="stat-item">
                    <i class="bi bi-card-list" />
                    <div class="stat-content">
                      <span class="stat-value">{{ stats.total }}</span>
                      <span class="stat-label">Всего карточек</span>
                    </div>
                  </div>
                </Card>
                <Card
                  padding="sm"
                  rounded="md">
                  <div class="stat-item">
                    <i class="bi bi-stars" />
                    <div class="stat-content">
                      <span class="stat-value">{{ stats.newCards }}</span>
                      <span class="stat-label">Новых</span>
                    </div>
                  </div>
                </Card>
                <Card
                  padding="sm"
                  rounded="md">
                  <div class="stat-item">
                    <i class="bi bi-arrow-repeat" />
                    <div class="stat-content">
                      <span class="stat-value">{{ stats.reviewCards }}</span>
                      <span class="stat-label">На повторении</span>
                    </div>
                  </div>
                </Card>
                <Card
                  highlight
                  padding="sm"
                  rounded="md">
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
                :disabled="!stats || stats.dueToday === 0"
                full-width
                size="lg"
                @click="handleStartTraining">
                <span class="text-lg font-semibold text-white drop-shadow-md tracking-wide">
                  <i class="bi bi-play-fill" />
                  {{ stats && stats.dueToday > 0 ? `Начать тренировку (${stats.dueToday})` : 'Нет карточек для повторения' }}
                </span>
              </Button>
            </div>
          </Card>

          <!-- QuickAddCard in left column -->
          <QuickAddCard
            ref="quickAddCardRef"
            :course-id="courseId"
            @added="handleQuickAdd" />
        </div>

        <!-- Right Column (Desktop): Cards Section -->
        <div
          v-if="isDesktop"
          class="cards-section flex flex-col overflow-hidden">
          <div class="section-header flex items-center justify-between mb-[16px] px-2 gap-2">
            <h2 class="section-title flex-1 mr-auto">Карточки</h2>
            <div class="flex gap-2">
              <Button
                v-if="!isSelectionMode && cards.length > 0"
                ghost
                size="sm"
                title="Очистить"
                variant="danger"
                @click="handleDeleteAllCards">
                <i class="bi bi-trash3" />
                Очистить
              </Button>
              <Button
                v-if="!isSelectionMode && cards.length > 0"
                size="sm"
                variant="ghost"
                @click="isSelectionMode = true">
                <i class="bi bi-check-square" />
                Выбрать
              </Button>
              <template v-else-if="isSelectionMode">
                <Button
                  :disabled="selectedCardIds.size === 0"
                  size="sm"
                  variant="danger"
                  @click="handleBatchDelete">
                  <i class="bi bi-trash" />
                  Удалить ({{ selectedCardIds.size }})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  @click="exitSelectionMode">
                  <i class="bi bi-x" />
                  Отменить
                </Button>
              </template>
              <Button
                v-if="!isSelectionMode"
                size="sm"
                variant="ghost"
                @click="handleCreateCard">
                <i class="bi bi-plus-lg" />
                Создать
              </Button>
            </div>
          </div>

          <CardList
            ref="cardListDesktopRef"
            :cards="cards"
            :loading="cardsLoading"
            :selected-ids="selectedCardIds"
            :selection-mode="isSelectionMode"
            @delete="handleDeleteCard"
            @edit="handleEditCard"
            @toggle-select="handleToggleCardSelection" />
        </div>
      </div>

      <!-- Mobile: Floating Action Button -->
      <Button
        v-if="!isDesktop && !isCardsPanelOpen && cards.length"
        aria-label="Показать список карточек"
        class="fab"
        rounded="full"
        size="lg"
        variant="primary"
        @click="openCardsPanel">
        <i class="bi bi-list-ul" />
        Показать карточки ({{ cards.length }})
      </Button>

      <!-- Mobile: Slide-out Panel -->
      <div class="cards-panel-container">
        <div
          v-if="!isDesktop && isCardsPanelOpen"
          class="panel-backdrop pointer-events-all"
          @click="closeCardsPanel" />
        <div
          ref="cardsPanel"
          :class="{ open: isCardsPanelOpen }"
          class="cards-panel pointer-events-all">
          <div class="panel-header flex items-center justify-between sticky top-0 z-1 py-[6px] ps-[12px] z-20 gap-3">
            <h2 class="panel-title mr-auto">Карточки</h2>
            <div class="flex">
              <Button
                v-if="!isSelectionMode && cards.length > 0"
                ghost
                size="sm"
                title="Очистить"
                variant="danger"
                @click="handleDeleteAllCards">
                <i class="bi bi-trash3" />
              </Button>
              <Button
                v-if="!isSelectionMode && cards.length > 0"
                size="sm"
                variant="ghost"
                @click="isSelectionMode = true">
                <i class="bi bi-check-square" />
                Выбрать
              </Button>
              <template v-else-if="isSelectionMode">
                <Button
                  :disabled="selectedCardIds.size === 0"
                  size="sm"
                  variant="danger"
                  @click="handleBatchDelete">
                  <i class="bi bi-trash" />
                  Удалить ({{ selectedCardIds.size }})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  @click="exitSelectionMode">
                  <i class="bi bi-x" />
                  Отменить
                </Button>
              </template>
              <Button
                v-if="!isSelectionMode"
                full-width
                size="sm"
                variant="ghost"
                @click="handleCreateCard">
                <i class="bi bi-plus-lg" />
                Создать
              </Button>
            </div>
            <Button
              aria-label="Закрыть панель"
              class="panel-close-btn ml-auto"
              size="sm"
              variant="ghost"
              @click="closeCardsPanel">
              <i class="bi bi-x-lg" />
            </Button>
          </div>
          <CardList
            ref="cardListMobileRef"
            :cards="cards"
            :loading="cardsLoading"
            :selected-ids="selectedCardIds"
            :selection-mode="isSelectionMode"
            class="panel-content flex-1 pl-[10px]"
            @delete="handleDeleteCard"
            @edit="handleEditCard"
            @toggle-select="handleToggleCardSelection" />
        </div>
      </div>
    </div>

    <CardEditorModal
      v-if="editingCard !== false"
      :card="editingCard"
      :course-id="courseId"
      :show="showEditorModal"
      @close="handleCloseModal"
      @save="handleSaveCard" />

    <CourseSettingsModal
      v-if="course"
      :course-id="courseId"
      :course-name="course.name"
      :show="showSettingsModal"
      @close="handleCloseSettings"
      @saved="handleSettingsSaved" />
  </div>
</template>

<style scoped>
  .page-container {
    max-width: 1440px;
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
    border: 3px solid var(--spinner-track);
    border-top-color: var(--spinner-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive Grid */
  .course-page-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  @media (min-width: 1025px) {
    .course-page-grid {
      grid-template-columns: 2fr 1fr;
    }
  }

  .course-title {
    letter-spacing: -0.02em;
    font-size: var(--text-page-title-size);
  }

  .course-description {
    font-size: var(--text-body-lg-size);
    color: var(--color-text-secondary);
    line-height: 1.6;
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
    color: var(--color-text-primary);
  }

  .stat-content {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: var(--text-caption-size);
    color: var(--color-text-secondary);
  }

  .course-actions {
    padding-top: 24px;
    border-top: 1px solid var(--color-border-light);
  }

  .cards-section {
    max-height: calc(100vh - 140px);
    height: calc(100vh - 140px);
  }

  @media (max-width: 1023px) {
    .cards-section {
      display: none;
    }
  }

  .section-title {
    font-size: var(--text-section-title-size);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  /* Mobile FAB */
  .fab {
    position: fixed;
    right: 50%;
    bottom: 12px;
    transform: translateX(50%);
    z-index: 998;
    display: flex;
  }

  .fab i {
    font-size: 18px;
  }

  @media (min-width: 1025px) {
    .fab {
      display: none;
    }
  }

  /* Mobile Slide-out Panel */
  .cards-panel-container {
    position: fixed;
    inset: 0;
    z-index: 999;
    pointer-events: none;
  }

  .panel-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999;
    pointer-events: all;
  }

  .cards-panel {
    position: fixed;
    opacity: 0;
    top: 36px;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 400px;
    background: var(--color-bg-modal);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
    will-change: transform, opacity;
    transform: translateX(100%);
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
    z-index: 1000;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    pointer-events: all;
  }

  @media (min-width: 769px) {
    .cards-panel {
      width: 85%;
    }
  }

  .cards-panel.open {
    transform: translateX(0);
    opacity: 1;
  }

  .panel-header {
    border-bottom: 1px solid var(--color-border-light);
    background: var(--color-bg-modal);
  }

  .panel-title {
    font-size: var(--text-section-title-size);
    font-weight: 600;
    color: var(--color-text-primary);
  }
</style>
