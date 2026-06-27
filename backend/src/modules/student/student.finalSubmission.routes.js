// src/modules/student/student.finalSubmission.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import {
  getMyFinalSubmissions,
  createMyFinalSubmission,
  getMyFinalSubmissionDetail,
  updateMyFinalSubmission,
} from './student.finalSubmission.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('Student'));

router.get('/', getMyFinalSubmissions);
router.post('/', createMyFinalSubmission);
router.get('/:id', getMyFinalSubmissionDetail);
router.put('/:id', updateMyFinalSubmission);

export default router;