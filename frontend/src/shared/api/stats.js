import api from './client'

export const statsApi = {
  /**
   * Получить глобальную статистику
   */
  async getGlobalStats() {
    const response = await api.get('/stats/global')
    return response.data
  }
}
