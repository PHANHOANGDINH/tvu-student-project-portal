// src/modules/teacher/teacher.progress.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import {
  getProgressReportsForTeacher,
  getProgressReportDetailForTeacher,
  reviewProgressReportForTeacher,
} from './teacher.progress.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('Teacher'));

router.get('/', getProgressReportsForTeacher);
router.get('/:id', getProgressReportDetailForTeacher);
router.patch('/:id/review', reviewProgressReportForTeacher);

export default router;