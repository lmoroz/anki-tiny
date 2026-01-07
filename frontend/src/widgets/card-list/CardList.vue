<script setup>
  import { ref, useTemplateRef, onMounted, onUnmounted } from 'vue'

  const scrollContainer = useTemplateRef('cardList')
  const showTopFade = ref(false)
  const showBottomFade = ref(true)
  const checkScroll = () => {
    const el = scrollContainer.value
    if (!el) {
      showTopFade.value = false
      showBottomFade.value = false
      return
    }

    // Порог срабатывания (например, 10px), чтобы не мерцало на границах
    const threshold = 10

    // Есть ли куда скроллить вверх?
    showTopFade.value = el.scrollTop > threshold

    // Есть ли куда скроллить вниз?
    // Проверка: (прокрученное + видимое) < (полная высота - порог)
    showBottomFade.value = el.scrollTop + el.clientHeight < el.scrollHeight - threshold
  }

  const props = defineProps({
    cards: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['edit', 'delete'])

  const handleEdit = card => {
    emit('edit', card)
  }

  const handleDelete = card => {
    emit('delete', card)
  }

  onMounted(() => {
    const el = scrollContainer.value
    if (el) {
      el.addEventListener('scroll', checkScroll)
      checkScroll()
    }
  })

  onUnmounted(() => {
    if (scrollContainer.value) {
      scrollContainer.value.removeEventListener('scroll', checkScroll)
    }
  })
</script>

<template>
  <div class="card-list relative flex flex-col flex-1 w-full min-h-0 rounded-lg overflow-hidden">
    <div
      class="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#08193D] to-transparent z-20 pointer-events-none transition-opacity duration-300"
      :class="showTopFade ? 'opacity-100' : 'opacity-0'" />
    <div
      v-if="loading"
      class="loading-state">
      <div
        class="skeleton-card"
        v-for="i in 3"
        :key="i" />
    </div>

    <div
      v-else-if="cards.length === 0"
      class="empty-state">
      <i class="bi bi-inbox" />
      <p>Карточек пока нет</p>
      <span>Добавьте первую карточку, чтобы начать обучение</span>
    </div>

    <div
      v-else
      ref="cardList"
      class="cards-grid z-10 flex flex-col flex-1 gap-4 overflow-y-auto snap-y snap-mandatory scroll-pt-3 p-1">
      <CardItem
        class="snap-start flex-[0_0_210px] z-5"
        v-for="card in cards"
        :key="card.id"
        :card="card"
        @edit="handleEdit"
        @delete="handleDelete" />
    </div>
    <div
      class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#08193D] to-transparent z-20 pointer-events-none transition-opacity duration-300"
      :class="showBottomFade ? 'opacity-100' : 'opacity-0'" />
  </div>
</template>

<style scoped>
  .card-list {
    width: 100%;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .skeleton-card {
    height: 140px;
    background: var(--color-bg-secondary);
    border-radius: 12px;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-state i {
    font-size: 64px;
    color: var(--color-text-muted);
    margin-bottom: 16px;
  }

  .empty-state p {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 8px 0;
  }

  .empty-state span {
    font-size: 14px;
    color: var(--color-text-tertiary);
  }
</style>
