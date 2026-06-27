// src/modules/teacher/teacher.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import teacherProjectsRoutes from './teacher.projects.routes.js';
import teacherProgressRoutes from './teacher.progress.routes.js';
import teacherFinalSubmissionRoutes from './teacher.finalSubmission.routes.js';

const router = express.Router();

router.get(
  '/workspace',
  authMiddleware,
  roleMiddleware('Teacher'),
  (req, res) => {
    res.json({
      message: 'Truy cập Teacher Workspace thành công',
      user: req.user,
    });
  }
);

router.use('/projects', teacherProjectsRoutes);
router.use('/progress', teacherProgressRoutes);
router.use('/final-submissions', teacherFinalSubmissionRoutes);

export default router;