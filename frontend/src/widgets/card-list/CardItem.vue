<script setup>
  import { ref } from 'vue'
  import { CardState } from '@/shared/types/card'

  const props = defineProps({
    card: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['edit', 'delete'])

  const isFlipped = ref(false)

  const toggleFlip = () => {
    isFlipped.value = !isFlipped.value
  }

  const handleEdit = e => {
    e.stopPropagation()
    emit('edit', props.card)
  }

  const handleDelete = e => {
    e.stopPropagation()
    emit('delete', props.card)
  }

  const getStateBadge = state => {
    switch (state) {
      case CardState.New:
        return { text: 'Новая', class: 'badge-new' }
      case CardState.Learning:
        return { text: 'Изучается', class: 'badge-learning' }
      case CardState.Review:
        return { text: 'Повторение', class: 'badge-review' }
      case CardState.Relearning:
        return { text: 'Переучивание', class: 'badge-relearning' }
      default:
        return { text: 'Неизвестно', class: '' }
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date - now
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return 'Просрочено'
    } else if (diffDays === 0) {
      return 'Сегодня'
    } else if (diffDays === 1) {
      return 'Завтра'
    } else if (diffDays < 7) {
      return `Через ${diffDays} дней`
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    }
  }
</script>

<template>
  <Card
    rounded="lg"
    class="card-item"
    hoverable
    :class="{ flipped: isFlipped }"
    @click="toggleFlip">
    <div class="card-content">
      <div class="card-front">
        <div class="card-header">
          <span
            class="state-badge"
            :class="getStateBadge(card.state).class">
            {{ getStateBadge(card.state).text }}
          </span>
          <div class="card-actions">
            <button
              class="action-btn edit-btn"
              @click="handleEdit"
              title="Редактировать">
              <i class="bi bi-pencil" />
            </button>
            <button
              class="action-btn delete-btn"
              @click="handleDelete"
              title="Удалить">
              <i class="bi bi-trash" />
            </button>
          </div>
        </div>

        <div class="card-body">
          <p class="card-text">{{ card.front }}</p>
        </div>

        <div class="card-footer">
          <span class="due-date">
            <i class="bi bi-calendar3" />
            {{ formatDate(card.due) }}
          </span>
          <span class="flip-hint">
            <i class="bi bi-arrow-repeat" />
            Показать ответ
          </span>
        </div>
      </div>

      <div class="card-back">
        <div class="card-header">
          <span class="back-label">Ответ</span>
        </div>

        <div class="card-body">
          <p class="card-text">{{ card.back }}</p>
        </div>

        <div class="card-footer">
          <span class="flip-hint">
            <i class="bi bi-arrow-repeat" />
            Скрыть ответ
          </span>
        </div>
      </div>
    </div>
  </Card>
</template>

<style scoped>
  .card-item {
    perspective: 1000px;
    cursor: pointer;
    min-height: 140px;
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }

  .card-item.flipped {
    transform: rotateY(180deg);
  }

  .card-content {
    width: 100%;
    height: 100%;
    min-height: 140px;
  }

  .card-front,
  .card-back {
    position: absolute;
    width: 100%;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    transition: all 0.25s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .card-back {
    transform: rotateY(180deg);
    display: none;
  }

  .card-item.flipped .card-front {
    display: none;
  }

  .card-item.flipped .card-back {
    display: flex;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .state-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-new {
    background: #e8f0fe;
    color: #1a73e8;
  }

  .badge-learning {
    background: #fef7e0;
    color: #f9ab00;
  }

  .badge-review {
    background: #e6f4ea;
    color: #0f9d58;
  }

  .badge-relearning {
    background: #fce8e6;
    color: #d93025;
  }

  .back-label {
    color: #e9ecef55;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-actions {
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .card-front:hover .card-actions {
    opacity: 1;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: #f1f3f4;
    color: #5f6368;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: #e8eaed;
    transform: scale(1.05);
  }

  .edit-btn:hover {
    color: #1a73e8;
  }

  .delete-btn:hover {
    color: #d93025;
  }

  .card-body {
    flex: 1;
    margin-bottom: 12px;
  }

  .card-text {
    color: #e9ecef;
    font-size: 15px;
    line-height: 1.6;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-back .card-text {
    -webkit-line-clamp: 4;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #e9ecef;
  }

  .due-date,
  .flip-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #e9ecefcc;
  }

  .due-date i,
  .flip-hint i {
    font-size: 14px;
  }

  .flip-hint {
    opacity: 0.7;
  }

  .card-item:hover .flip-hint {
    opacity: 1;
    color: #e9ecef99;
  }
</style>
