import express from 'express'
import auth from '../../middlewares/auth.middleware.js'
import role from '../../middlewares/role.middleware.js'
import { USER_ROLES } from '../../constants/roles.js'
import * as controller from './topicRounds.controller.js'
export const lecturerTopicRoundRoutes = express.Router()
lecturerTopicRoundRoutes.use(auth, role(USER_ROLES.LECTURER))
lecturerTopicRoundRoutes.route('/').get(controller.lecturerList).post(controller.create)
lecturerTopicRoundRoutes.put('/:id', controller.update)
lecturerTopicRoundRoutes.patch('/:id/status', controller.status)
export const studentTopicRoundRoutes = express.Router()
studentTopicRoundRoutes.use(auth, role(USER_ROLES.STUDENT))
studentTopicRoundRoutes.get('/', controller.studentList)
