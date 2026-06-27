// src/modules/student/student.progress.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import {
  getMyProgressReports,
  createMyProgressReport,
  getMyProgressReportDetail,
  updateMyProgressReport,
  deleteMyProgressReport,
} from './student.progress.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('Student'));

router.get('/', getMyProgressReports);
router.post('/', createMyProgressReport);
router.get('/:id', getMyProgressReportDetail);
router.put('/:id', updateMyProgressReport);
router.delete('/:id', deleteMyProgressReport);

export default router;