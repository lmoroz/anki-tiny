import { db } from '../database';
import { Settings, SettingsUpdate, CourseSettings, CourseSettingsUpdate } from '../database/schema';
import { FSRSSettings } from '../fsrs';

/**
 * Repository для работы с настройками
 */
export class SettingsRepository {
  /**
   * Получить глобальные настройки
   * Если настроек нет, создаем дефолтные
   */
  async getGlobalSettings(): Promise<Settings> {
    let settings = await db.selectFrom('settings').where('id', '=', 1).selectAll().executeTakeFirst();

    if (!settings) {
      // Создаем дефолтные настройки
      settings = await db
        .insertInto('settings')
        .values({
          trainingStartHour: 8,
          trainingEndHour: 22,
          trainingStartTime: 480, // 8:00 in minutes
          trainingEndTime: 1320, // 22:00 in minutes
          minTimeBeforeEnd: 4,
          notificationsEnabled: 1,
          learningSteps: '[10, 240]',
          enableFuzz: 1,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return settings;
  }

  /**
   * Обновить глобальные настройки
   */
  async updateGlobalSettings(data: SettingsUpdate): Promise<Settings> {
    const existing = await this.getGlobalSettings();

    const result = await db
      .updateTable('settings')
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where('id', '=', existing.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Получить настройки курса
   */
  async getCourseSettings(courseId: number): Promise<CourseSettings | null> {
    const settings = await db.selectFrom('courseSettings').where('courseId', '=', courseId).selectAll().executeTakeFirst();

    return settings || null;
  }

  /**
   * Обновить или создать настройки курса
   */
  async updateCourseSettings(courseId: number, data: CourseSettingsUpdate): Promise<CourseSettings> {
    const existing = await this.getCourseSettings(courseId);

    if (existing) {
      // Обновить существующие
      const result = await db
        .updateTable('courseSettings')
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .where('courseId', '=', courseId)
        .returningAll()
        .executeTakeFirstOrThrow();

      return result;
    }

    // Создать новые
    const result = await db
      .insertInto('courseSettings')
      .values({
        courseId,
        ...data,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Удалить настройки курса (сброс к глобальным)
   */
  async deleteCourseSettings(courseId: number): Promise<void> {
    await db.deleteFrom('courseSettings').where('courseId', '=', courseId).execute();
  }

  /**
   * Получить эффективные настройки для курса
   * (индивидуальные курса или глобальные)
   */
  async getEffectiveSettings(courseId: number): Promise<FSRSSettings> {
    const globalSettings = await this.getGlobalSettings();
    const courseSettings = await this.getCourseSettings(courseId);

    if (!courseSettings) {
      // Используем глобальные настройки
      return {
        trainingStartTime: globalSettings.trainingStartTime,
        trainingEndTime: globalSettings.trainingEndTime,
        minTimeBeforeEnd: globalSettings.minTimeBeforeEnd,
        notificationsEnabled: globalSettings.notificationsEnabled === 1,
        learningSteps: globalSettings.learningSteps,
        enableFuzz: globalSettings.enableFuzz === 1,
      };
    }

    // Объединяем настройки (приоритет у индивидуальных)
    return {
      trainingStartTime: courseSettings.trainingStartTime ?? globalSettings.trainingStartTime,
      trainingEndTime: courseSettings.trainingEndTime ?? globalSettings.trainingEndTime,
      minTimeBeforeEnd: courseSettings.minTimeBeforeEnd ?? globalSettings.minTimeBeforeEnd,
      notificationsEnabled: (courseSettings.notificationsEnabled ?? globalSettings.notificationsEnabled) === 1,
      learningSteps: courseSettings.learningSteps ?? globalSettings.learningSteps,
      enableFuzz: (courseSettings.enableFuzz ?? globalSettings.enableFuzz) === 1,
    };
  }
}

// Singleton instance
export const settingsRepository = new SettingsRepository();
