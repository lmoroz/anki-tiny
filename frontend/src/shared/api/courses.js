import api from './client';

/**
 * API сервис для работы с курсами
 */
export const coursesApi = {
  /**
   * Получить все курсы
   * @returns {Promise<Course[]>}
   */
  async getAll() {
    const response = await api.get('/courses');
    return response.data;
  },

  /**
   * Получить курс по ID
   * @param {number} id - ID курса
   * @returns {Promise<Course>}
   */
  async getById(id) {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  /**
   * Создать новый курс
   * @param {CreateCourseDto} data - Данные для создания курса
   * @returns {Promise<Course>}
   */
  async create(data) {
    const response = await api.post('/courses', data);
    return response.data;
  },

  /**
   * Обновить курс
   * @param {number} id - ID курса
   * @param {UpdateCourseDto} data - Данные для обновления
   * @returns {Promise<Course>}
   */
  async update(id, data) {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  /**
   * Удалить курс
   * @param {number} id - ID курса
   * @returns {Promise<{message: string}>}
   */
  async delete(id) {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },
};
