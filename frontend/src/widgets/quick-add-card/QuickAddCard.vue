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

  const parseBatchInput = text => {
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

  const switchMode = newMode => {
    mode.value = newMode
    errors.value = { front: '', back: '', batch: '' }
  }
</script>

<template>
  <Card class="mb-8">
    <div class="card-header">
      <h3 class="section-title text-shadow-white text-white">
        <StackedCardsIcon class="w-20 h-20 shrink-0" />
        Быстрое добавление карточек
      </h3>
      <!-- Toggle Switch -->
      <div class="bg-gray-500/20 border border-white/30 backdrop-blur-md p-1.5 rounded-full flex items-center">
        <Button
          :variant="mode === 'single' ? 'primary' : 'ghost'"
          rounded="full"
          @click="switchMode('single')">
          <i class="bi bi-file-earmark-plus" />
          Одна карточка
        </Button>
        <!-- Active Button with bottom shadow -->
        <Button
          :variant="mode === 'single' ? 'ghost' : 'primary'"
          rounded="full"
          @click="switchMode('batch')">
          <i class="bi bi-files" />
          Массовое добавление
        </Button>
      </div>
    </div>

    <div
      v-if="mode === 'single'"
      class="quick-form">
      <div class="form-row">
        <div class="form-col">
          <Input
            v-model="formData.front"
            label="Вопрос"
            placeholder="Например: What is Vue 3?"
            :error="errors.front" />
        </div>
        <div class="form-col">
          <Input
            v-model="formData.back"
            label="Ответ"
            placeholder="Например: A progressive JavaScript framework"
            :error="errors.back" />
        </div>
      </div>

      <div class="form-actions">
        <Button
          @click="handleAdd"
          variant="primary"
          :disabled="loading">
          <i
            v-if="!loading"
            class="bi bi-plus-lg" />
          <span v-if="loading">Добавление...</span>
          <span v-else>Добавить карточку</span>
        </Button>
      </div>
    </div>

    <div
      v-else
      class="batch-form">
      <Input
        v-model="batchText"
        type="textarea"
        stacked
        label="Карточки (каждая строка — новая карточка)"
        placeholder="банты | бАнты
бороду | бОроду (вин. п., только в этой форме ед.ч. ударение на 1-ом слоге)
бухгалтеров | бухгАлтеров"
        :rows="10"
        :error="errors.batch" />

      <div
        class="batch-help relative overflow-hidden rounded-2xl border border-2 border-blue-400/80 bg-gradient-to-r from-blue-600/20 via-blue-900/20 to-slate-900/20 p-4 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(59,130,246,0.5),inset_0_0_20px_-5px_rgba(59,130,246,0.1)]">
        <div class="relative flex items-center gap-4">
          <!-- Glowing Icon -->
          <div class="w-5 h-5 flex items-center justify-center rounded-full border border-white/90 shadow-[0_0_20px_-2px_rgba(255,255,255,0.8)]">
            <i class="bi bi-info text-white leading-none" />
          </div>

          <!-- Content -->
          <div class="flex flex-wrap items-center gap-3 text-lg">
            <span class="text-white font-medium tracking-wide drop-shadow-sm">Пример:</span>

            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-3 py-1 rounded-lg bg-slate-700/50 border border-white/10 text-blue-100 font-mono text-base shadow-inner">вопрос</span>

              <span class="text-blue-400/80 text-xl mx-0.5">|</span>

              <span class="px-3 py-1 rounded-lg bg-slate-700/50 border border-white/10 text-blue-100 font-mono text-base shadow-inner">ответ</span>
            </div>
          </div>
          <div class="text-white/50 ml-8">(каждая строка — новая карточка)</div>
        </div>
      </div>

      <div class="form-actions">
        <Button
          @click="handleBatchAdd"
          variant="primary"
          stacked
          :disabled="loading">
          <i
            v-if="!loading"
            class="bi bi-plus-lg" />
          <span v-if="loading">Добавление...</span>
          <span v-else>Добавить все карточки</span>
        </Button>
      </div>
    </div>
  </Card>
</template>

<style scoped>
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
    font-size: var(--text-section-title-size);
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: transparent;
    border: 1px solid var(--mode-switcher-border);
    border-radius: 6px;
    color: var(--mode-switcher-text);
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
    border-color: var(--mode-switcher-border-active);
    color: var(--mode-switcher-text-active);
  }

  .mode-btn:hover i {
    transform: scale(1.05);
  }

  .mode-btn.active {
    background: transparent;
    color: var(--mode-switcher-text-active);
    border: 2px solid var(--mode-switcher-border-active);
    font-weight: 600;
  }

  .mode-btn.active i {
    color: var(--mode-switcher-text-active);
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

  .form-col {
    flex: 1;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
  }

  .batch-help .icon {
    font-size: 16px;
    color: var(--color-bg-primary);
    flex-shrink: 0;
    margin-top: 1px;
  }
</style>
