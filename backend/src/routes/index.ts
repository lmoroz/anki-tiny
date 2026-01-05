import { Router } from 'express';
import coursesRouter from './courses';
import cardsRouter from './cards';
import trainingRouter from './training';
import settingsRouter from './settings';

const router = Router();

router.use(coursesRouter);
router.use(cardsRouter);
router.use(trainingRouter);
router.use(settingsRouter);

export default router;
