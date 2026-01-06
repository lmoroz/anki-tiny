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
    getEffectiveSettings: (state) => (courseId) => {
      if (!courseId) return state.globalSettings
      return state.courseSettings.get(courseId) || state.globalSettings
    },

    // Проверить, использует ли курс индивидуальные настройки
    hasCustomSettings: (state) => (courseId) => {
      return state.courseSettings.has(courseId)
    }
  },

  actions: {
    // Загрузить глобальные настройки
    async fetchGlobalSettings() {
      this.loading = true
      this.error = null
      try {
        this.globalSettings = await settingsAPI.getGlobalSettings()
      }
      catch (error) {
        this.error = error.message
        throw error
      }
      finally {
        this.loading = false
      }
    },

    // Обновить глобальные настройки
    async updateGlobalSettings(settings) {
      this.loading = true
      this.error = null
      try {
        this.globalSettings = await settingsAPI.updateGlobalSettings(settings)
      }
      catch (error) {
        this.error = error.message
        throw error
      }
      finally {
        this.loading = false
      }
    },

    // Загрузить настройки курса
    async fetchCourseSettings(courseId) {
      this.loading = true
      this.error = null
      try {
        const settings = await settingsAPI.getCourseSettings(courseId)
        this.courseSettings.set(courseId, settings)
      }
      catch (error) {
        // 404 означает что курс использует глобальные настройки
        if (error.response?.status === 404) {
          this.courseSettings.delete(courseId)
        }
        else {
          this.error = error.message
          throw error
        }
      }
      finally {
        this.loading = false
      }
    },

    // Обновить настройки курса
    async updateCourseSettings(courseId, settings) {
      this.loading = true
      this.error = null
      try {
        const updated = await settingsAPI.updateCourseSettings(courseId, settings)
        this.courseSettings.set(courseId, updated)
      }
      catch (error) {
        this.error = error.message
        throw error
      }
      finally {
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
      }
      catch (error) {
        this.error = error.message
        throw error
      }
      finally {
        this.loading = false
      }
    }
  }
})
