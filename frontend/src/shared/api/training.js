import api from './client';

export const trainingApi = {
  /**
   * Получить карточки для повторения
   * @param {number} courseId
   * @param {boolean} sessionMode
   */
  async getDueCards(courseId, sessionMode = false) {
    const response = await api.get(`/courses/${courseId}/due-cards`, {
      params: { session: sessionMode },
    });
    return response.data;
  },

  /**
   * Получить карточки для глобальной тренировки из всех курсов
   * @param {string} timezone
   */
  async getGlobalDueCards(timezone = 'UTC') {
    const response = await api.get('/training/global/due-cards', {
      params: { timezone },
    });
    return response.data;
  },

  /**
   * Отправить результат повторения
   * @param {number} cardId
   * @param {number} rating
   * @param {string} timezone
   */
  async submitReview(cardId, rating, timezone = 'UTC') {
    const response = await api.post('/training/review', {
      cardId,
      rating,
      timezone,
    });
    return response.data;
  },

  /**
   * Получить статистику за день
   */
  async getStats(timezone = 'UTC') {
    const response = await api.get('/training/stats', {
      params: { timezone },
    });
    return response.data;
  },
};
