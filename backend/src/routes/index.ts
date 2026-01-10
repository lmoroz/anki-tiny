import { Router } from 'express';
import coursesRouter from './courses.js';
import cardsRouter from './cards.js';
import trainingRouter from './training.js';
import settingsRouter from './settings.js';
import statsRouter from './stats.js';

const router = Router();

// Важно: courses должен быть зарегистрирован раньше cards,
// чтобы избежать конфликта /courses/:id с /courses/:courseId/cards
router.use('/courses', coursesRouter);
router.use(cardsRouter);
router.use(trainingRouter);
router.use(settingsRouter);
router.use('/stats', statsRouter);

export default router;
