import express from 'express'
import auth from '../../middlewares/auth.middleware.js'
import role from '../../middlewares/role.middleware.js'
import { USER_ROLES } from '../../constants/roles.js'
import * as controller from './topicRounds.controller.js'
import { uploadTopicRoundFile } from '../../middlewares/topicRoundUpload.middleware.js'
export const lecturerTopicRoundRoutes = express.Router()
lecturerTopicRoundRoutes.use(auth, role(USER_ROLES.LECTURER))
lecturerTopicRoundRoutes.route('/').get(controller.lecturerList).post(controller.create)
lecturerTopicRoundRoutes.route('/:id/files').get(controller.files).post(uploadTopicRoundFile,controller.uploadFile)
lecturerTopicRoundRoutes.get('/files/:fileId/download',controller.downloadFile)
lecturerTopicRoundRoutes.delete('/files/:fileId',controller.removeFile)
lecturerTopicRoundRoutes.put('/:id', controller.update)
lecturerTopicRoundRoutes.patch('/:id/status', controller.status)
export const studentTopicRoundRoutes = express.Router()
studentTopicRoundRoutes.use(auth, role(USER_ROLES.STUDENT))
studentTopicRoundRoutes.get('/', controller.studentList)
studentTopicRoundRoutes.get('/:id/files',controller.files)
studentTopicRoundRoutes.post('/:id/register',controller.register)
studentTopicRoundRoutes.put('/:id/registration',controller.updateRegistration)
studentTopicRoundRoutes.get('/files/:fileId/download',controller.downloadFile)
