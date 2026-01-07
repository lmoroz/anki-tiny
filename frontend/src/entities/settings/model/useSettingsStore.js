import { defineStore } from 'pinia'
import { settingsAPI } from '@/shared/api/settings.js'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    globalSettings: null,
    courseSettings: new Map(), // courseId -> CourseSettings
    loading: false,
    error: null
  }),

  getters: {
    // Получить эффективные настройки для курса (с fallback на глобальные)
    getEffectiveSettings: state => courseId => {
      if (!courseId) return state.globalSettings
      const customSettings = state.courseSettings.get(courseId)
      return customSettings || state.globalSettings
    },

    // Проверить, использует ли курс индивидуальные настройки
    hasCustomSettings: state => courseId => {
      return state.courseSettings.has(courseId)
    }
  },

  actions: {
    // Загрузить глобальные настройки
    async fetchGlobalSettings(from = 'unknown') {
      console.log('fetchGlobalSettings from ', from)
      this.loading = true
      this.error = null
      try {
        const response = await settingsAPI.getGlobalSettings()
        this.globalSettings = response
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Обновить глобальные настройки
    async updateGlobalSettings(settings) {
      this.loading = true
      this.error = null
      try {
        // Бэк возвращает данные напрямую
        this.globalSettings = await settingsAPI.updateGlobalSettings(settings)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Загрузить настройки курса
    async fetchCourseSettings(courseId) {
      this.loading = true
      this.error = null
      try {
        const response = await settingsAPI.getCourseSettings(courseId)
        // Бэк возвращает { courseSettings, effectiveSettings }
        // Если courseSettings !== null, то у курса есть индивидуальные настройки
        if (response.courseSettings) {
          this.courseSettings.set(courseId, response.courseSettings)
        } else {
          // Если courseSettings === null, то курс использует глобальные
          this.courseSettings.delete(courseId)
        }
      } catch (error) {
        // 404 означает что курс использует глобальные настройки
        if (error.response?.status === 404) {
          this.courseSettings.delete(courseId)
        } else {
          this.error = error.message
          throw error
        }
      } finally {
        this.loading = false
      }
    },

    // Обновить настройки курса
    async updateCourseSettings(courseId, settings) {
      this.loading = true
      this.error = null
      try {
        const response = await settingsAPI.updateCourseSettings(courseId, settings)
        this.courseSettings.set(courseId, response.settings)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Сбросить настройки курса к глобальным
    async resetCourseSettings(courseId) {
      this.loading = true
      this.error = null
      try {
        await settingsAPI.resetCourseSettings(courseId)
        this.courseSettings.delete(courseId)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
