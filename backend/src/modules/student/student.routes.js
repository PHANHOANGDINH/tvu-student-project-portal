// src/modules/student/student.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import studentProjectsRoutes from './student.projects.routes.js';
import studentProgressRoutes from './student.progress.routes.js';
import studentFinalSubmissionRoutes from './student.finalSubmission.routes.js';

const router = express.Router();

router.get(
  '/workspace',
  authMiddleware,
  roleMiddleware('Student'),
  (req, res) => {
    res.json({
      message: 'Truy cập Student Workspace thành công',
      user: req.user,
    });
  }
);

router.use('/projects', studentProjectsRoutes);
router.use('/progress', studentProgressRoutes);
router.use('/final-submissions', studentFinalSubmissionRoutes);

export default router;