<script setup>
  import { ref, useTemplateRef, onMounted, onUnmounted } from 'vue'
  import useScrollAndHighlight from './composables/useScrollAndHighlight.js'

  const { scrollTo, highlight, useFades, showTopFade, showBottomFade } = useScrollAndHighlight()

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

  const scrollContainer = useTemplateRef('cardsGrid')
  useFades(scrollContainer)

  const handleEdit = card => emit('edit', card)

  const handleDelete = card => emit('delete', card)

  const scrollToCardWithBounce = cardId => {
    const cardElement = scrollContainer.value?.querySelector(`[data-card-id="${cardId}"]`)

    if (!cardElement) {
      console.warn(`Card with id ${cardId} not found in list`)
      return
    }
    scrollTo(cardElement, scrollContainer.value)
    highlight(cardElement, 'anim-bounce-in-bck', 500)
  }

  defineExpose({
    scrollToCardWithBounce
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
      ref="cardsGrid"
      class="cards-grid z-10 flex flex-col flex-1 gap-4 overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-pt-3 p-1">
      <CardItem
        class="snap-start flex-[0_0_210px] z-5"
        v-for="card in cards"
        :key="card.id"
        :data-card-id="card.id"
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

  .anim-bounce-in-bck {
    animation-duration: 2s;
    animation-name: bounce-in-bck;
    z-index: 99;
  }

  @keyframes bounce-in-bck {
    0% {
      opacity: 0;
      animation-timing-function: ease-in;
      transform: scale(7);
    }
    38% {
      opacity: 1;
      animation-timing-function: ease-out;
      transform: scale(1);
    }
    55% {
      opacity: 0.5;
      animation-timing-function: ease-in;
      transform: scale(1.5);
    }
    72%,
    89%,
    to {
      opacity: 1;
      animation-timing-function: ease-out;
      transform: scale(1);
    }
    81% {
      animation-timing-function: ease-in;
      transform: scale(1.24);
    }
    95% {
      animation-timing-function: ease-in;
      transform: scale(1.04);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .anim-bounce-in-bck {
      animation: none;
    }
  }
</style>
