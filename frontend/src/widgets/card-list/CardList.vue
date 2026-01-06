<script setup>
import CardItem from './CardItem.vue'

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

const handleEdit = (card) => {
  emit('edit', card)
}

const handleDelete = (card) => {
  emit('delete', card)
}
</script>

<template>
  <div class="card-list">
    <div v-if="loading" class="loading-state">
      <div class="skeleton-card" v-for="i in 3" :key="i" />
    </div>

    <div v-else-if="cards.length === 0" class="empty-state">
      <i class="bi bi-inbox" />
      <p>Карточек пока нет</p>
      <span>Добавьте первую карточку, чтобы начать обучение</span>
    </div>

    <div v-else class="cards-grid">
      <CardItem
        v-for="card in cards"
        :key="card.id"
        :card="card"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
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

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
