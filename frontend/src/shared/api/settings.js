import apiClient from './client.js';

export const settingsAPI = {
  // Глобальные настройки
  async getGlobalSettings() {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  async updateGlobalSettings(settings) {
    // Очищаем payload - отправляем только определённые поля
    // SQLite не принимает undefined, поэтому фильтруем
    const payload = {};

    // Добавляем только те поля, которые определены
    if (settings.trainingStartTime !== undefined) {
      payload.trainingStartTime = settings.trainingStartTime;
    }
    if (settings.trainingEndTime !== undefined) {
      payload.trainingEndTime = settings.trainingEndTime;
    }
    if (settings.minTimeBeforeEnd !== undefined) {
      payload.minTimeBeforeEnd = settings.minTimeBeforeEnd;
    }
    if (settings.notificationsEnabled !== undefined) {
      payload.notificationsEnabled = settings.notificationsEnabled;
    }
    if (settings.learningSteps !== undefined) {
      payload.learningSteps = settings.learningSteps;
    }
    if (settings.enableFuzz !== undefined) {
      payload.enableFuzz = settings.enableFuzz;
    }

    const response = await apiClient.put('/settings', payload);
    return response.data;
  },

  // Настройки курса
  async getCourseSettings(courseId) {
    const response = await apiClient.get(`/courses/${courseId}/settings`);
    return response.data;
  },

  async updateCourseSettings(courseId, settings) {
    // Очищаем payload - отправляем только определённые поля
    // SQLite не принимает undefined, поэтому фильтруем
    const payload = {};

    // Добавляем только те поля, которые определены
    if (settings.trainingStartTime !== undefined && settings.trainingStartTime !== null) {
      payload.trainingStartTime = settings.trainingStartTime;
    }
    if (settings.trainingEndTime !== undefined && settings.trainingEndTime !== null) {
      payload.trainingEndTime = settings.trainingEndTime;
    }
    if (settings.minTimeBeforeEnd !== undefined && settings.minTimeBeforeEnd !== null) {
      payload.minTimeBeforeEnd = settings.minTimeBeforeEnd;
    }
    if (settings.notificationsEnabled !== undefined && settings.notificationsEnabled !== null) {
      payload.notificationsEnabled = settings.notificationsEnabled;
    }
    if (settings.learningSteps !== undefined && settings.learningSteps !== null) {
      payload.learningSteps = settings.learningSteps;
    }
    if (settings.enableFuzz !== undefined && settings.enableFuzz !== null) {
      payload.enableFuzz = settings.enableFuzz;
    }

    const response = await apiClient.put(`/courses/${courseId}/settings`, payload);
    return response.data;
  },

  async resetCourseSettings(courseId) {
    await apiClient.delete(`/courses/${courseId}/settings`);
  },
};
