// src/modules/teacher/teacher.projects.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import {
  getTeacherProjects,
  getTeacherProjectDetail,
  createTeacherProject,
  updateTeacherProject,
  deleteTeacherProject,
  getTeacherProjectRegistrations,
  approveTeacherProjectRegistration,
  rejectTeacherProjectRegistration,
} from './teacher.projects.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('Teacher'));

router.get('/', getTeacherProjects);
router.post('/', createTeacherProject);

router.get('/:id', getTeacherProjectDetail);
router.put('/:id', updateTeacherProject);
router.delete('/:id', deleteTeacherProject);

router.get('/:id/registrations', getTeacherProjectRegistrations);

router.patch(
  '/registrations/:registrationId/approve',
  approveTeacherProjectRegistration
);

router.patch(
  '/registrations/:registrationId/reject',
  rejectTeacherProjectRegistration
);

export default router;