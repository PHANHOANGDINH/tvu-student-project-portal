// src/modules/admin/admin.users.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import {
  getAdminUsers,
  getAdminUserDetail,
  createAdminUser,
  updateAdminUser,
  lockAdminUser,
  unlockAdminUser,
  resetPasswordAdminUser,
  deleteAdminUser,
} from './admin.users.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('Admin'));

router.get('/', getAdminUsers);
router.get('/:id', getAdminUserDetail);
router.post('/', createAdminUser);
router.put('/:id', updateAdminUser);
router.patch('/:id/lock', lockAdminUser);
router.patch('/:id/unlock', unlockAdminUser);
router.patch('/:id/reset-password', resetPasswordAdminUser);
router.delete('/:id', deleteAdminUser);

export default router;