import apiClient from './client.js'

export const settingsAPI = {
  // Глобальные настройки
  async getGlobalSettings() {
    const response = await apiClient.get('/settings')
    return response.data
  },

  async updateGlobalSettings(settings) {
    const response = await apiClient.put('/settings', settings)
    return response.data
  },

  // Настройки курса
  async getCourseSettings(courseId) {
    const response = await apiClient.get(`/courses/${courseId}/settings`)
    return response.data
  },

  async updateCourseSettings(courseId, settings) {
    const response = await apiClient.put(`/courses/${courseId}/settings`, settings)
    return response.data
  },

  async resetCourseSettings(courseId) {
    await apiClient.delete(`/courses/${courseId}/settings`)
  }
}
