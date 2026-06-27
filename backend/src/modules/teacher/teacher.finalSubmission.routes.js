// src/modules/teacher/teacher.finalSubmission.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import {
  getFinalSubmissionsForTeacher,
  getFinalSubmissionDetailForTeacher,
  reviewFinalSubmissionForTeacher,
} from './teacher.finalSubmission.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('Teacher'));

router.get('/', getFinalSubmissionsForTeacher);
router.get('/:id', getFinalSubmissionDetailForTeacher);
router.patch('/:id/review', reviewFinalSubmissionForTeacher);

export default router;