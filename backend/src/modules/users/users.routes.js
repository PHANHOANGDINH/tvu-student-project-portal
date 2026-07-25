import express from 'express';
import { USER_ROLES } from '../../constants/roles.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import {
  createUser,
  getUserById,
  getUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from './users.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(USER_ROLES.ADMIN));

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);
router.post('/:id/reset-password', resetUserPassword);

export default router;
