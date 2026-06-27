// src/routes/index.js
import express from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import teacherRoutes from '../modules/teacher/teacher.routes.js';
import studentRoutes from '../modules/student/student.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    message: 'Backend TVU Student Project Portal đang hoạt động',
    time: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);

export default router;