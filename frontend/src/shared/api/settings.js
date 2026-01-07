import apiClient from './client.js'

export const settingsAPI = {
  // Глобальные настройки
  async getGlobalSettings() {
    const response = await apiClient.get('/settings')
    return response.data
  },

  async updateGlobalSettings(settings) {
    // Очищаем payload - отправляем только определённые поля
    // SQLite не принимает undefined, поэтому фильтруем
    const payload = {}
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined && value !== null) payload[key] = value
    })

    const response = await apiClient.put('/settings', payload)
    return response.data
  },

  // Настройки курса
  async getCourseSettings(courseId) {
    const response = await apiClient.get(`/courses/${courseId}/settings`)
    return response.data
  },

  async updateCourseSettings(courseId, settings) {
    // Очищаем payload - отправляем только определённые поля
    // SQLite не принимает undefined, поэтому фильтруем
    const payload = {}
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined && value !== null) payload[key] = value
    })

    const response = await apiClient.put(`/courses/${courseId}/settings`, payload)
    return response.data
  },

  async resetCourseSettings(courseId) {
    await apiClient.delete(`/courses/${courseId}/settings`)
  }
}
