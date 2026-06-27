// src/modules/student/student.projects.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import {
  getStudentAvailableProjects,
  getStudentProjectDetail,
  registerStudentProject,
  getMyProjectRegistrations,
  cancelMyProjectRegistration,
} from './student.projects.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('Student'));

router.get('/', getStudentAvailableProjects);
router.get('/my-registrations', getMyProjectRegistrations);

router.get('/:id', getStudentProjectDetail);
router.post('/:id/register', registerStudentProject);

router.patch(
  '/registrations/:registrationId/cancel',
  cancelMyProjectRegistration
);

export default router;