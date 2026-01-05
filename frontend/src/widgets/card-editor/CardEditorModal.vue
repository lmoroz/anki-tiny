<script setup>
import { ref, watch } from 'vue'
import Modal from '@/shared/ui/Modal.vue'
import Input from '@/shared/ui/Input.vue'
import Button from '@/shared/ui/Button.vue'

const props = defineProps({
  card: {
    type: Object,
    default: null
  },
  courseId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

const formData = ref({
  front: '',
  back: ''
})

const errors = ref({
  front: '',
  back: ''
})

const isEditMode = ref(false)

// Инициализация формы
const initForm = () => {
  if (props.card) {
    isEditMode.value = true
    formData.value = {
      front: props.card.front,
      back: props.card.back
    }
  } else {
    isEditMode.value = false
    formData.value = {
      front: '',
      back: ''
    }
  }
  errors.value = { front: '', back: '' }
}

watch(() => props.card, initForm, { immediate: true })

const validateForm = () => {
  errors.value = { front: '', back: '' }
  let isValid = true

  if (!formData.value.front.trim()) {
    errors.value.front = 'Вопрос обязателен'
    isValid = false
  } else if (formData.value.front.length > 10000) {
    errors.value.front = 'Вопрос слишком длинный (макс. 10000 символов)'
    isValid = false
  }

  if (!formData.value.back.trim()) {
    errors.value.back = 'Ответ обязателен'
    isValid = false
  } else if (formData.value.back.length > 10000) {
    errors.value.back = 'Ответ слишком длинный (макс. 10000 символов)'
    isValid = false
  }

  return isValid
}

const handleSave = () => {
  if (!validateForm()) {
    return
  }

  const data = {
    front: formData.value.front.trim(),
    back: formData.value.back.trim()
  }

  emit('save', data)
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Modal @close="handleClose">
    <template #header>
      <h2>{{ isEditMode ? 'Редактировать карточку' : 'Создать карточку' }}</h2>
    </template>

    <template #body>
      <div class="form-group">
        <Input
          v-model="formData.front"
          label="Вопрос"
          type="textarea"
          :rows="4"
          placeholder="Введите вопрос..."
          :error="errors.front"
        />
      </div>

      <div class="form-group">
        <Input
          v-model="formData.back"
          label="Ответ"
          type="textarea"
          :rows="4"
          placeholder="Введите ответ..."
          :error="errors.back"
        />
      </div>

      <div class="char-counter">
        <span>Вопрос: {{ formData.front.length }} / 10000</span>
        <span>Ответ: {{ formData.back.length }} / 10000</span>
      </div>
    </template>

    <template #footer>
      <div class="modal-actions">
        <Button @click="handleClose" variant="secondary">
          Отмена
        </Button>
        <Button @click="handleSave" variant="primary">
          {{ isEditMode ? 'Сохранить' : 'Создать' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-of-type {
  margin-bottom: 12px;
}

.char-counter {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
