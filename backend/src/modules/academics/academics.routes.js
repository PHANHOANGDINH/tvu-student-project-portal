import express from 'express';

import { USER_ROLES } from '../../constants/roles.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import {
  academicYearsController,
  courseClassesController,
  lecturerCourseClassesController,
  semestersController,
  studentCourseClassesController,
  subjectsController,
} from './academics.controller.js';

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(USER_ROLES.ADMIN)];
const lecturerOnly = [authMiddleware, roleMiddleware(USER_ROLES.LECTURER)];
const studentOnly = [authMiddleware, roleMiddleware(USER_ROLES.STUDENT)];

router.get('/academic-years', ...adminOnly, academicYearsController.list);
router.post('/academic-years', ...adminOnly, academicYearsController.create);
router.get('/academic-years/:id', ...adminOnly, academicYearsController.get);
router.put('/academic-years/:id', ...adminOnly, academicYearsController.update);
router.patch('/academic-years/:id/status', ...adminOnly, academicYearsController.status);

router.get('/semesters', ...adminOnly, semestersController.list);
router.post('/semesters', ...adminOnly, semestersController.create);
router.get('/semesters/:id', ...adminOnly, semestersController.get);
router.put('/semesters/:id', ...adminOnly, semestersController.update);
router.patch('/semesters/:id/status', ...adminOnly, semestersController.status);

router.get('/subjects', ...adminOnly, subjectsController.list);
router.post('/subjects', ...adminOnly, subjectsController.create);
router.get('/subjects/:id', ...adminOnly, subjectsController.get);
router.put('/subjects/:id', ...adminOnly, subjectsController.update);
router.patch('/subjects/:id/status', ...adminOnly, subjectsController.status);

router.get('/course-classes', ...adminOnly, courseClassesController.list);
router.post('/course-classes', ...adminOnly, courseClassesController.create);
router.get('/course-classes/:id', ...adminOnly, courseClassesController.get);
router.put('/course-classes/:id', ...adminOnly, courseClassesController.update);
router.patch('/course-classes/:id/status', ...adminOnly, courseClassesController.status);
router.put('/course-classes/:id/lecturer', ...adminOnly, courseClassesController.assignLecturer);
router.get('/course-classes/:id/students', ...adminOnly, courseClassesController.students);
router.post('/course-classes/:id/students', ...adminOnly, courseClassesController.enroll);
router.delete('/course-classes/:id/students/:studentId', ...adminOnly, courseClassesController.removeStudent);

router.get('/lecturer/course-classes', ...lecturerOnly, lecturerCourseClassesController.list);
router.get('/lecturer/course-classes/:id', ...lecturerOnly, lecturerCourseClassesController.get);
router.get('/lecturer/course-classes/:id/students', ...lecturerOnly, lecturerCourseClassesController.students);

router.get('/student/course-classes', ...studentOnly, studentCourseClassesController.list);
router.get('/student/course-classes/:id', ...studentOnly, studentCourseClassesController.get);

export default router;
