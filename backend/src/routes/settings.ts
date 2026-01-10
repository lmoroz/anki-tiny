import { Router, type Request, type Response } from 'express';
import { settingsRepository } from '../services/repositories/settingsRepository.js';
import { GlobalSettingsSchema, CourseSettingsSchema } from '../schemas/settings.js';
import { ZodError } from 'zod';
import { statsScheduler } from '../services/statsScheduler.js';

const router = Router();

/**
 * GET /api/settings
 * Получить глобальные настройки
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await settingsRepository.getGlobalSettings();

    // Преобразуем SQLite boolean (0/1) в boolean
    const result = {
      ...settings,
      notificationsEnabled: settings.notificationsEnabled === 1,
      enableFuzz: settings.enableFuzz === 1,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/settings
 * Обновить глобальные настройки
 */
router.put('/settings', async (req: Request, res: Response) => {
  let validatedData: Record<string, unknown> = {};
  let updateData: Record<string, unknown> = {};
  try {
    // Валидация
    validatedData = GlobalSettingsSchema.parse(req.body);

    // Преобразуем boolean в SQLite boolean (0/1)
    updateData = {
      ...validatedData,
      enableFuzz: validatedData.enableFuzz ? 1 : 0,
      notificationsEnabled: validatedData.notificationsEnabled ? 1 : 0,
    };

    const settings = await settingsRepository.updateGlobalSettings(updateData);

    // Преобразуем обратно
    const result = {
      ...settings,
      notificationsEnabled: settings.notificationsEnabled === 1,
      enableFuzz: settings.enableFuzz === 1,
    };

    // Broadcast обновлённую статистику
    await statsScheduler.broadcastStats();

    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', validatedData, updateData });
    }
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings', validatedData, updateData });
  }
});

/**
 * GET /api/courses/:courseId/settings
 * Получить настройки курса
 */
router.get('/courses/:courseId/settings', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(<string>req.params.courseId, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const courseSettings = await settingsRepository.getCourseSettings(courseId);
    const effectiveSettings = await settingsRepository.getEffectiveSettings(courseId);

    res.json({
      courseSettings: courseSettings
        ? {
            ...courseSettings,
            notificationsEnabled: courseSettings.notificationsEnabled === 1,
            enableFuzz: courseSettings.enableFuzz === 1,
          }
        : null,
      effectiveSettings,
    });
  } catch (error) {
    console.error('Error fetching course settings:', error);
    res.status(500).json({ error: 'Failed to fetch course settings' });
  }
});

/**
 * PUT /api/courses/:courseId/settings
 * Обновить настройки курса
 */
router.put('/courses/:courseId/settings', async (req: Request, res: Response) => {
  let validatedData: Record<string, unknown> = {};
  let updateData: Record<string, unknown> = {};
  try {
    const courseId = parseInt(<string>req.params.courseId, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    // Валидация
    validatedData = CourseSettingsSchema.parse(req.body);

    // Преобразуем boolean в SQLite boolean (0/1)
    // const updateData: Record<string, unknown> = { ...validatedData };
    // Преобразуем boolean в SQLite boolean (0/1)
    updateData = {
      ...validatedData,
      enableFuzz: validatedData.enableFuzz ? 1 : 0,
      notificationsEnabled: validatedData.notificationsEnabled ? 1 : 0,
    };

    const settings = await settingsRepository.updateCourseSettings(courseId, updateData);

    // Broadcast обновлённую статистику
    await statsScheduler.broadcastStats();

    res.json({ settings });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues, validatedData, updateData });
    }
    console.error('Error updating course settings:', error);
    res.status(500).json({ error: 'Failed to update course settings', validatedData, updateData });
  }
});

/**
 * DELETE /api/courses/:courseId/settings
 * Сброс настроек курса к глобальным
 */
router.delete('/courses/:courseId/settings', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(<string>req.params.courseId, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    await settingsRepository.deleteCourseSettings(courseId);

    res.json({ success: true, message: 'Course settings reset to global' });
  } catch (error) {
    console.error('Error deleting course settings:', error);
    res.status(500).json({ error: 'Failed to delete course settings' });
  }
});

export default router;
