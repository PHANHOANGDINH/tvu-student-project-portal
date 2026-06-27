// src/modules/admin/admin.classes.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import {
  getAdminClasses,
  getAdminClassDetail,
  createAdminClass,
  updateAdminClass,
  lockAdminClass,
  unlockAdminClass,
  deleteAdminClass,
  getAdminClassStudents,
  addAdminClassStudent,
  removeAdminClassStudent,
} from './admin.classes.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('Admin'));

router.get('/', getAdminClasses);
router.post('/', createAdminClass);

router.get('/:id', getAdminClassDetail);
router.put('/:id', updateAdminClass);
router.patch('/:id/lock', lockAdminClass);
router.patch('/:id/unlock', unlockAdminClass);
router.delete('/:id', deleteAdminClass);

router.get('/:id/students', getAdminClassStudents);
router.post('/:id/students', addAdminClassStudent);
router.delete('/:id/students/:studentId', removeAdminClassStudent);

export default router;