<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { toast } from 'vue3-toastify'
  import { useConfirm } from '@/shared/lib/useConfirm'
  import { useSettingsStore } from '@/entities/settings/model/useSettingsStore.js'

  const props = defineProps({
    show: Boolean,
    courseId: {
      type: Number,
      required: true
    },
    courseName: String
  })

  const emit = defineEmits(['close', 'saved'])

  const settingsStore = useSettingsStore()
  const useCustomSettings = ref(false)
  const settings = ref(null)
  const saving = ref(false)

  const effectiveSettings = computed(() => {
    return settingsStore.getEffectiveSettings(props.courseId)
  })

  const hasCustom = computed(() => {
    return settingsStore.hasCustomSettings(props.courseId)
  })

  onMounted(async () => {
    // Убеждаемся что глобальные настройки загружены
    if (!settingsStore.globalSettings) {
      await settingsStore.fetchGlobalSettings('CourseSettingsModal onMounted')
    }

    // Загружаем настройки курса
    // Store сам определит, есть ли индивидуальные настройки или нет
    await settingsStore.fetchCourseSettings(props.courseId)

    // Определяем, использует ли курс индивидуальные настройки
    useCustomSettings.value = hasCustom.value

    // Получаем эффективные настройки (индивидуальные или глобальные)
    const effective = effectiveSettings.value

    if (effective) {
      settings.value = { ...effective }
    } else {
      // Фоллбэк
      settings.value = { ...settingsStore.globalSettings }
    }
  })

  async function handleSave(formSettings) {
    saving.value = true
    try {
      if (useCustomSettings.value) {
        console.log('CourseSettingsModal handleSave', useCustomSettings.value, formSettings)
        await settingsStore.updateCourseSettings(props.courseId, formSettings)
        toast.success('Индивидуальные настройки курса сохранены!')
      } else {
        // Если юзер переключил на глобальные, сбросить индивидуальные
        if (hasCustom.value) {
          await settingsStore.resetCourseSettings(props.courseId)
          toast.success('Настройки переключены на глобальные')
        }
      }
      emit('saved')
      emit('close')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Ошибка сохранения настроек!')
    } finally {
      saving.value = false
    }
  }

  async function handleReset() {
    const { confirm } = useConfirm()
    const confirmed = await confirm('Сбросить настройки к глобальным?')
    if (confirmed) {
      await settingsStore.resetCourseSettings(props.courseId)
      settings.value = { ...settingsStore.globalSettings }
      useCustomSettings.value = false
      toast.success('Настройки сброшены!')
    }
  }

  function toggleCustomSettings(value) {
    useCustomSettings.value = value
    if (!value) {
      settings.value = { ...settingsStore.globalSettings }
    }
  }
</script>

<template>
  <Modal
    :show="show"
    @close="emit('close')">
    <template #header>
      <h2>Настройки курса: {{ courseName }}</h2>
    </template>

    <div class="course-settings-modal">
      <!-- Переключатель -->
      <div class="settings-mode-toggle">
        <label class="radio-label">
          <input
            type="radio"
            :checked="!useCustomSettings"
            @change="toggleCustomSettings(false)" />
          <span>Использовать глобальные настройки</span>
        </label>
        <label class="radio-label">
          <input
            type="radio"
            :checked="useCustomSettings"
            @change="toggleCustomSettings(true)" />
          <span>Индивидуальные настройки</span>
        </label>
      </div>

      <!-- Форма -->
      <SettingsForm
        v-if="settings"
        v-model="settings"
        :readonly="!useCustomSettings || saving"
        :show-save-button="false"
        :is-course-settings="true"
        @save="handleSave" />

      <!-- Кнопка сброса -->
      <Button
        v-if="hasCustom"
        variant="danger"
        full-width
        @click="handleReset">
        Сбросить к глобальным
      </Button>
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="emit('close')">
        Отмена
      </Button>
      <Button
        variant="primary"
        :disabled="saving || !useCustomSettings"
        @click="handleSave(settings)">
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </Button>
    </template>
  </Modal>
</template>

<style scoped>
  .course-settings-modal {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .settings-mode-toggle {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--input-bg);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: var(--text-body-md-size);
    color: var(--color-text-primary);
  }

  .radio-label input[type='radio'] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
</style>
