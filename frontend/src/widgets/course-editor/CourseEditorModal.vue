<script setup>
  import { ref, computed, watch } from 'vue'
  import Modal from '@/shared/ui/Modal.vue'
  import Input from '@/shared/ui/Input.vue'
  import Button from '@/shared/ui/Button.vue'

  const props = defineProps({
    show: {
      type: Boolean,
      default: false
    },
    course: {
      type: Object,
      default: null
    }
  })

  const emit = defineEmits(['close', 'save'])

  const formData = ref({
    name: '',
    description: ''
  })

  const errors = ref({
    name: ''
  })

  const isEditing = computed(() => !!props.course)

  const modalTitle = computed(() => {
    return isEditing.value ? 'Редактирование курса' : 'Создание курса'
  })
  const resetForm = () => {
    formData.value = {
      name: '',
      description: ''
    }
    errors.value = {
      name: ''
    }
  }

  const validateForm = () => {
    let valid = true

    if (!formData.value.name.trim()) {
      errors.value.name = 'Название курса обязательно'
      valid = false
    } else if (formData.value.name.trim().length < 3) {
      errors.value.name = 'Название должно содержать минимум 3 символа'
      valid = false
    } else {
      errors.value.name = ''
    }

    return valid
  }

  const handleSave = () => {
    if (!validateForm()) {
      return
    }

    const data = {
      name: formData.value.name.trim(),
      description: formData.value.description.trim() || undefined
    }

    emit('save', data)
  }

  const handleClose = () => {
    resetForm()
    emit('close')
  }

  const handleNameInput = () => {
    if (errors.value.name) {
      errors.value.name = ''
    }
  }

  // Обновляем форму при изменении курса
  watch(
    () => props.course,
    newCourse => {
      if (newCourse) {
        formData.value = {
          name: newCourse.name || '',
          description: newCourse.description || ''
        }
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )
</script>

<template>
  <Modal
    :show="show"
    :title="modalTitle"
    @close="handleClose">
    <div class="editor-form">
      <Input
        v-model="formData.name"
        label="Название курса *"
        placeholder="Введите название курса"
        :error="errors.name"
        @input="handleNameInput" />

      <Input
        v-model="formData.description"
        type="textarea"
        label="Описание"
        placeholder="Введите описание курса (опционально)"
        :rows="4" />
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose">
        Отмена
      </Button>
      <Button
        variant="primary"
        @click="handleSave">
        {{ isEditing ? 'Сохранить' : 'Создать' }}
      </Button>
    </template>
  </Modal>
</template>

<style scoped>
  .editor-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>
