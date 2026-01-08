import { Router } from 'express';
import coursesRouter from './courses';
import cardsRouter from './cards';
import trainingRouter from './training';
import settingsRouter from './settings';
import statsRouter from './stats';

const router = Router();

// Важно: courses должен быть зарегистрирован раньше cards,
// чтобы избежать конфликта /courses/:id с /courses/:courseId/cards
router.use('/courses', coursesRouter);
router.use(cardsRouter);
router.use(trainingRouter);
router.use(settingsRouter);
router.use(statsRouter);

export default router;
