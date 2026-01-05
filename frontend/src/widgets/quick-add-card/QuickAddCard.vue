<script setup>
import { ref } from 'vue'
import Input from '@/shared/ui/Input.vue'
import Button from '@/shared/ui/Button.vue'

const props = defineProps({
  courseId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['added'])

const formData = ref({
  front: '',
  back: ''
})

const loading = ref(false)
const errors = ref({
  front: '',
  back: ''
})

const validateForm = () => {
  errors.value = { front: '', back: '' }
  let isValid = true

  if (!formData.value.front.trim()) {
    errors.value.front = 'Вопрос обязателен'
    isValid = false
  }

  if (!formData.value.back.trim()) {
    errors.value.back = 'Ответ обязателен'
    isValid = false
  }

  return isValid
}

const handleAdd = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const cardData = {
      front: formData.value.front.trim(),
      back: formData.value.back.trim()
    }

    emit('added', cardData)

    // Очистка формы после успешного добавления
    formData.value = {
      front: '',
      back: ''
    }
    errors.value = { front: '', back: '' }
  } catch (err) {
    console.error('Error adding card:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="quick-add-card">
    <h3 class="section-title">
      <i class="bi bi-plus-circle" />
      Быстрое добавление карточки
    </h3>

    <div class="quick-form">
      <div class="form-row">
        <div class="form-col">
          <Input
            v-model="formData.front"
            label="Вопрос"
            placeholder="Например: What is Vue 3?"
            :error="errors.front"
          />
        </div>
        <div class="form-col">
          <Input
            v-model="formData.back"
            label="Ответ"
            placeholder="Например: A progressive JavaScript framework"
            :error="errors.back"
          />
        </div>
      </div>

      <div class="form-actions">
        <Button
          @click="handleAdd"
          variant="primary"
          :disabled="loading"
        >
          <i v-if="!loading" class="bi bi-plus-lg" />
          <span v-if="loading">Добавление...</span>
          <span v-else>Добавить карточку</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-add-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(51, 65, 85, 0.5));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 16px 0;
}

.section-title i {
  font-size: 20px;
  color: #3b82f6;
}

.quick-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-col {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
