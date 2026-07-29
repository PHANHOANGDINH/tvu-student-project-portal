// src/modules/admin/admin.projects.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';
import { USER_ROLES } from '../../constants/roles.js';

import {
  getAdminProjects,
  getAdminProjectDetail,
  updateAdminProjectStatus,
  deleteAdminProject,
} from './admin.projects.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(USER_ROLES.ADMIN));

router.get('/', getAdminProjects);
router.get('/:id', getAdminProjectDetail);
router.patch('/:id/status', updateAdminProjectStatus);
router.delete('/:id', deleteAdminProject);

export default router;

