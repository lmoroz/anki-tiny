import { Router, type Request, type Response } from 'express';
import { courseRepository } from '../services/repositories/courseRepository.js';
import { cardRepository } from '../services/repositories/cardRepository.js';
import { createCourseSchema, updateCourseSchema } from '../schemas/course.js';
import { ZodError } from 'zod';
import { statsScheduler } from '../services/statsScheduler.js';

const router = Router();

// GET /api/courses - получить все курсы со статистикой
router.get('/', async (_req: Request, res: Response) => {
  try {
    const courses = await courseRepository.findAll();
    const statsMap = await cardRepository.getAllCoursesStats();

    // Добавляем статистику к каждому курсу
    const coursesWithStats = courses.map((course) => {
      const stats = statsMap.get(course.id) || {
        total: 0,
        newCards: 0,
        lastTraining: null,
        dueToday: 0,
      };

      return {
        ...course,
        stats,
      };
    });

    res.json(coursesWithStats);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/courses/:id - получить курс по ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(<string>req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await courseRepository.findById(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// POST /api/courses - создать новый курс
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createCourseSchema.parse(req.body);
    const course = await courseRepository.create(validatedData);

    // Broadcast обновлённую статистику
    await statsScheduler.broadcastStats();

    res.status(201).json(course);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id - обновить курс
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(<string>req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const validatedData = updateCourseSchema.parse(req.body);
    const course = await courseRepository.update(id, validatedData);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Broadcast обновлённую статистику
    await statsScheduler.broadcastStats();

    res.json(course);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /api/courses/:id - удалить курс
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(<string>req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const deleted = await courseRepository.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Broadcast обновлённую статистику
    await statsScheduler.broadcastStats();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;
