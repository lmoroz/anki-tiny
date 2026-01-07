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
    class="course-card flex flex-col cursor-pointer"
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

    <p class="course-description">
      {{ course.description }}
    </p>

    <div class="course-footer mt-auto">
      <div class="course-meta">
        <i class="bi bi-clock" />
        <span>Обновлено {{ formattedDate }}</span>
      </div>
    </div>
  </Card>
</template>

<style scoped>
  .course-card {
    transition: all 0.25s ease;
  }

  .course-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--card-shadow-hover);
    border-color: var(--color-primary-light);
  }

  .course-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }

  .course-title {
    font-size: var(--text-section-title-size);
    font-weight: 600;
    color: var(--color-text-primary);
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
    background: var(--action-btn-bg);
    color: var(--action-btn-text);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--action-btn-bg-hover);
    color: var(--action-btn-text-hover);
  }

  .action-delete:hover {
    background: var(--action-btn-delete-bg-hover);
    color: var(--color-danger);
  }

  .course-description {
    font-size: var(--text-body-md-size);
    color: var(--color-text-secondary);
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
    border-top: 1px solid var(--color-border-light);
  }

  .course-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-body-sm-size);
    color: var(--color-text-primary);
  }

  .course-meta i {
    font-size: 12px;
  }
</style>
