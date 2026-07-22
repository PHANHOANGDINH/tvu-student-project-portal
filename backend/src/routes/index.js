// src/routes/index.js
import express from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import { classGroupRoutes, groupRoutes, lecturerTopicRoutes } from '../modules/groups/groups.routes.js';
import { lecturerSubmissionRoutes, studentSubmissionRoutes } from '../modules/submissions/submissionRequirements.routes.js';
import { lecturerSubmissionViewRoutes, studentSubmissionUploadRoutes } from '../modules/submissions/submissions.routes.js';
import { lecturerGradingRoutes, studentGradingRoutes } from '../modules/grading/grading.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import { adminDashboardRoutes, lecturerDashboardRoutes, studentDashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { academicYearRoutes, semesterRoutes, subjectRoutes, courseClassRoutes, studentCourseClassRoutes, lecturerCourseClassRoutes } from '../modules/academics/academics.routes.js';
import { adminStudentImportRoutes,courseClassStudentRoutes } from '../modules/students/studentImport.routes.js';
import lecturerImportRoutes from '../modules/lecturers/lecturerImport.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    message: 'Backend TVU Student Project Portal Ä‘ang hoáº¡t Ä‘á»™ng',
    time: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/semesters', semesterRoutes);
router.use('/subjects', subjectRoutes);
router.use('/student/course-classes', studentCourseClassRoutes);
router.use('/lecturer/course-classes', lecturerCourseClassRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/lecturer/dashboard', lecturerDashboardRoutes);
router.use('/student/dashboard', studentDashboardRoutes);
router.use('/admin/students',adminStudentImportRoutes);
router.use('/admin/lecturers',lecturerImportRoutes);
router.use('/course-classes/:courseClassId/groups', classGroupRoutes);
router.use('/course-classes/:courseClassId/students',courseClassStudentRoutes);
router.use('/course-classes', courseClassRoutes);
router.use('/groups', groupRoutes);
router.use('/lecturer/topic-registrations', lecturerTopicRoutes);
router.use('/lecturer/submission-requirements', lecturerSubmissionRoutes);
router.use('/student/submission-requirements', studentSubmissionRoutes);
router.use('/student', studentSubmissionUploadRoutes);
router.use('/lecturer', lecturerSubmissionViewRoutes);
router.use('/lecturer', lecturerGradingRoutes);
router.use('/student', studentGradingRoutes);

export default router;
