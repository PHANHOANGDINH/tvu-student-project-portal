// src/modules/admin/admin.users.routes.js
import express from 'express'
import multer from 'multer'

import authMiddleware from '../../middlewares/auth.middleware.js'
import roleMiddleware from '../../middlewares/role.middleware.js'

import {
  getAdminUsers,
  getAdminUserDetail,
  createAdminUser,
  updateAdminUser,
  lockAdminUser,
  unlockAdminUser,
  resetPasswordAdminUser,
  deleteAdminUser,
  importUsersFromExcel,
} from './admin.users.controller.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

router.use(authMiddleware)
router.use(roleMiddleware('Admin'))

router.get('/', getAdminUsers)
router.get('/:id', getAdminUserDetail)
router.post('/', createAdminUser)

router.post('/import-excel', upload.single('file'), importUsersFromExcel)

router.put('/:id', updateAdminUser)
router.patch('/:id/lock', lockAdminUser)
router.patch('/:id/unlock', unlockAdminUser)
router.patch('/:id/reset-password', resetPasswordAdminUser)
router.delete('/:id', deleteAdminUser)

export default router