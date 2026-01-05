import { Router } from 'express';
import coursesRouter from './courses';

const router = Router();

router.use('/courses', coursesRouter);

export default router;
