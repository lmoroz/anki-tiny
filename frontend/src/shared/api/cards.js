import api from './client'

export const cardsApi = {
  /**
   * Получить все карточки курса
   */
  async getByCourseId(courseId) {
    const response = await api.get(`/courses/${courseId}/cards`)
    return response.data.cards
  },

  /**
   * Создать новую карточку
   */
  async create(courseId, data) {
    const response = await api.post(`/courses/${courseId}/cards`, data)
    return response.data.card
  },

  /**
   * Получить карточку по ID
   */
  async getById(id) {
    const response = await api.get(`/cards/${id}`)
    return response.data.card
  },

  /**
   * Обновить карточку
   */
  async update(id, data) {
    const response = await api.put(`/cards/${id}`, data)
    return response.data.card
  },

  /**
   * Удалить карточку
   */
  async delete(id) {
    await api.delete(`/cards/${id}`)
  },

  /**
   * Получить статистику курса
   */
  async getCourseStats(courseId) {
    const response = await api.get(`/courses/${courseId}/stats`)
    return response.data.stats
  }
}
