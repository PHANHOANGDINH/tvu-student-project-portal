import express from 'express'
import auth from '../../middlewares/auth.middleware.js'
import role from '../../middlewares/role.middleware.js'
import { USER_ROLES } from '../../constants/roles.js'
import * as controller from './academics.controller.js'
function adminRouter(entity){const r=express.Router();r.use(auth,role(USER_ROLES.ADMIN));r.get('/',controller.list(entity));r.post('/',controller.create(entity));r.get('/:id',controller.detail(entity));r.put('/:id',controller.update(entity));r.patch('/:id/status',controller.status(entity));return r}
export const academicYearRoutes=adminRouter('academicYears')
export const semesterRoutes=adminRouter('semesters')
export const subjectRoutes=adminRouter('subjects')
export const courseClassRoutes=adminRouter('courseClasses')
export const studentCourseClassRoutes=express.Router()
studentCourseClassRoutes.use(auth,role(USER_ROLES.STUDENT))
studentCourseClassRoutes.get('/',controller.studentList)
studentCourseClassRoutes.get('/:id',controller.studentDetail)