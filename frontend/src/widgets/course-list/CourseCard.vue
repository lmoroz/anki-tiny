<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    course: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['click', 'edit', 'delete'])

  const formattedDate = computed(() => {
    const date = new Date(props.course.updatedAt)
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  })

  const handleEdit = event => {
    event.stopPropagation()
    emit('edit', props.course)
  }

  const handleDelete = event => {
    event.stopPropagation()
    emit('delete', props.course)
  }
</script>

<template>
  <Card
    class="course-card"
    @click="emit('click', course)">
    <div class="course-header">
      <h3 class="course-title">{{ course.name }}</h3>
      <div class="course-actions">
        <button
          class="action-btn"
          @click="handleEdit"
          title="Редактировать">
          <i class="bi bi-pencil" />
        </button>
        <button
          class="action-btn action-delete"
          @click="handleDelete"
          title="Удалить">
          <i class="bi bi-trash" />
        </button>
      </div>
    </div>

    <p
      v-if="course.description"
      class="course-description">
      {{ course.description }}
    </p>

    <div class="course-footer">
      <div class="course-meta">
        <i class="bi bi-clock" />
        <span>Обновлено {{ formattedDate }}</span>
      </div>
    </div>
  </Card>
</template>

<style scoped>
  .course-card {
    cursor: pointer;
    transition: all 0.25s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .course-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #d2e3fc;
  }

  .course-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }

  .course-title {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    flex: 1;
  }

  .course-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .course-card:hover .course-actions {
    opacity: 1;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: #f1f3f4;
    color: #5f6368;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: #e8eaed;
    color: #202124;
  }

  .action-delete:hover {
    background: #fce8e6;
    color: #d93025;
  }

  .course-description {
    font-size: 14px;
    color: #e9ecefee;
    margin: 0 0 16px 0;
    flex: 1;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }

  .course-footer {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid #e9ecef;
  }

  .course-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #e9ecef;
  }

  .course-meta i {
    font-size: 12px;
  }
</style>
