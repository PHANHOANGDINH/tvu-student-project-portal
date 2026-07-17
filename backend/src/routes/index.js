// src/routes/index.js
import express from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import teacherRoutes from '../modules/teacher/teacher.routes.js';
import studentRoutes from '../modules/student/student.routes.js';
import { classGroupRoutes, groupRoutes, lecturerTopicRoutes } from '../modules/groups/groups.routes.js';
import { lecturerSubmissionRoutes, studentSubmissionRoutes } from '../modules/submissions/submissionRequirements.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    message: 'Backend TVU Student Project Portal đang hoạt động',
    time: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/course-classes/:courseClassId/groups', classGroupRoutes);
router.use('/groups', groupRoutes);
router.use('/lecturer/topic-registrations', lecturerTopicRoutes);
router.use('/lecturer/submission-requirements', lecturerSubmissionRoutes);
router.use('/student/submission-requirements', studentSubmissionRoutes);

export default router;
