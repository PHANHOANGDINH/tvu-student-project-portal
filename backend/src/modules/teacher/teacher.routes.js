// src/modules/teacher/teacher.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import { USER_ROLES } from '../../constants/roles.js';

import teacherProjectsRoutes from './teacher.projects.routes.js';
import teacherProgressRoutes from './teacher.progress.routes.js';
import teacherFinalSubmissionRoutes from './teacher.finalSubmission.routes.js';

const router = express.Router();

router.get(
  '/workspace',
  authMiddleware,
  roleMiddleware(USER_ROLES.LECTURER),
  (req, res) => {
    res.json({
      message: 'Truy cáº­p Teacher Workspace thĂ nh cĂ´ng',
      user: req.user,
    });
  }
);

router.use('/projects', teacherProjectsRoutes);
router.use('/progress', teacherProgressRoutes);
router.use('/final-submissions', teacherFinalSubmissionRoutes);

export default router;

