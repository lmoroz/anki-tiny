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

const mode = ref('single')
const formData = ref({
  front: '',
  back: ''
})
const batchText = ref('')

const loading = ref(false)
const errors = ref({
  front: '',
  back: '',
  batch: ''
})

const validateForm = () => {
  errors.value = { front: '', back: '', batch: '' }
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

const parseBatchInput = (text) => {
  const lines = text.split('\n').filter(line => line.trim())
  const cards = []
  const invalidLines = []

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return

    if (!trimmedLine.includes('|')) {
      invalidLines.push(`Строка ${index + 1}: отсутствует разделитель |`)
      return
    }

    const parts = trimmedLine.split('|')
    if (parts.length !== 2) {
      invalidLines.push(`Строка ${index + 1}: неверный формат (должно быть ровно один разделитель |)`)
      return
    }

    const [front, back] = parts.map(p => p.trim())

    if (!front) {
      invalidLines.push(`Строка ${index + 1}: пустая лицевая сторона`)
      return
    }

    if (!back) {
      invalidLines.push(`Строка ${index + 1}: пустая обратная сторона`)
      return
    }

    cards.push({ front, back })
  })

  return { cards, invalidLines }
}

const validateBatchInput = () => {
  errors.value.batch = ''

  if (!batchText.value.trim()) {
    errors.value.batch = 'Введите карточки для добавления'
    return false
  }

  const { cards, invalidLines } = parseBatchInput(batchText.value)

  if (invalidLines.length > 0) {
    errors.value.batch = invalidLines.join('\n')
    return false
  }

  if (cards.length === 0) {
    errors.value.batch = 'Не найдено корректных карточек'
    return false
  }

  return true
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

    formData.value = {
      front: '',
      back: ''
    }
    errors.value = { front: '', back: '', batch: '' }
  } catch (err) {
    console.error('Error adding card:', err)
  } finally {
    loading.value = false
  }
}

const handleBatchAdd = async () => {
  if (!validateBatchInput()) {
    return
  }

  loading.value = true

  try {
    const { cards } = parseBatchInput(batchText.value)

    for (const card of cards) {
      emit('added', card)
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    batchText.value = ''
    errors.value = { front: '', back: '', batch: '' }
  } catch (err) {
    console.error('Error adding batch cards:', err)
    errors.value.batch = 'Ошибка при добавлении карточек'
  } finally {
    loading.value = false
  }
}

const switchMode = (newMode) => {
  mode.value = newMode
  errors.value = { front: '', back: '', batch: '' }
}
</script>

<template>
  <div class="quick-add-card">
    <div class="card-header">
      <h3 class="section-title">
        <i class="bi bi-plus-circle" />
        Быстрое добавление карточек
      </h3>
      <div class="mode-switcher">
        <button
          :class="['mode-btn', { active: mode === 'single' }]"
          @click="switchMode('single')"
        >
          <i class="bi bi-file-earmark-plus" />
          Одна карточка
        </button>
        <button
          :class="['mode-btn', { active: mode === 'batch' }]"
          @click="switchMode('batch')"
        >
          <i class="bi bi-files" />
          Массовое добавление
        </button>
      </div>
    </div>

    <div v-if="mode === 'single'" class="quick-form">
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

    <div v-else class="batch-form">
      <Input
        v-model="batchText"
        type="textarea"
        label="Карточки (каждая строка — новая карточка)"
        placeholder="банты | бАнты
бороду | бОроду (вин. п., только в этой форме ед.ч. ударение на 1-ом слоге)
бухгалтеров | бухгАлтеров"
        :rows="10"
        :error="errors.batch"
      />
      
      <div class="batch-help">
        <i class="bi bi-info-circle" />
        <span>Формат: <code>вопрос | ответ</code> (каждая строка — новая карточка)</span>
      </div>

      <div class="form-actions">
        <Button
          @click="handleBatchAdd"
          variant="primary"
          :disabled="loading"
        >
          <i v-if="!loading" class="bi bi-plus-lg" />
          <span v-if="loading">Добавление...</span>
          <span v-else>Добавить все карточки</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-add-card {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  gap: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #202124;
  margin: 0;
  letter-spacing: -0.01em;
}

.section-title i {
  font-size: 22px;
  color: #1a73e8;
}

.mode-switcher {
  display: flex;
  gap: 8px;
  background: transparent;
  padding: 0;
  border-radius: 8px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #dadce0;
  border-radius: 6px;
  color: #5f6368;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
}

.mode-btn i {
  font-size: 14px;
  transition: transform 0.2s ease;
}

.mode-btn:hover {
  border-color: #1a73e8;
  color: #1a73e8;
}

.mode-btn:hover i {
  transform: scale(1.05);
}

.mode-btn.active {
  background: transparent;
  color: #1a73e8;
  border: 2px solid #1a73e8;
  font-weight: 600;
}

.mode-btn.active i {
  color: #1a73e8;
}

.quick-form,
.batch-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .quick-add-card {
    padding: 24px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .section-title {
    font-size: 18px;
  }

  .mode-switcher {
    width: 100%;
  }

  .mode-btn {
    flex: 1;
    justify-content: center;
    padding: 10px 12px;
  }

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
  margin-top: 4px;
}

.batch-help {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #e8f0fe;
  border: 1px solid #d2e3fc;
  border-radius: 8px;
  font-size: 13px;
  color: #1967d2;
  line-height: 1.6;
}

.batch-help i {
  font-size: 16px;
  color: #1a73e8;
  flex-shrink: 0;
  margin-top: 1px;
}

.batch-help code {
  padding: 2px 6px;
  background: #ffffff;
  border: 1px solid #dadce0;
  border-radius: 4px;
  color: #202124;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  font-weight: 500;
}
</style>


