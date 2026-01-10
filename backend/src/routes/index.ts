import { Router } from 'express';
import coursesRouter from './courses.ts';
import cardsRouter from './cards.ts';
import trainingRouter from './training.ts';
import settingsRouter from './settings.ts';
import statsRouter from './stats.ts';

const router = Router();

// Важно: courses должен быть зарегистрирован раньше cards,
// чтобы избежать конфликта /courses/:id с /courses/:courseId/cards
router.use('/courses', coursesRouter);
router.use(cardsRouter);
router.use(trainingRouter);
router.use(settingsRouter);
router.use('/stats', statsRouter);

export default router;
