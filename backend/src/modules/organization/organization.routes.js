import express from 'express'
import auth from '../../middlewares/auth.middleware.js'
import role from '../../middlewares/role.middleware.js'
import { USER_ROLES } from '../../constants/roles.js'
import * as controller from './organization.controller.js'

export const facultyRoutes=express.Router()
export const administrativeClassRoutes=express.Router()
export const administrativeStudentRoutes=express.Router()
for(const router of [facultyRoutes,administrativeClassRoutes,administrativeStudentRoutes])router.use(auth,role(USER_ROLES.ADMIN))
facultyRoutes.get('/',controller.listFaculties);facultyRoutes.get('/:id',controller.getFaculty);facultyRoutes.post('/',controller.createFaculty)
facultyRoutes.put('/:id',controller.updateFaculty);facultyRoutes.patch('/:id/status',controller.setFacultyStatus);facultyRoutes.delete('/:id',controller.deleteFaculty)
administrativeClassRoutes.get('/',controller.listClasses);administrativeClassRoutes.get('/:id',controller.getClass);administrativeClassRoutes.post('/',controller.createClass)
administrativeClassRoutes.put('/:id',controller.updateClass);administrativeClassRoutes.patch('/:id/status',controller.setClassStatus);administrativeClassRoutes.delete('/:id',controller.deleteClass)
administrativeClassRoutes.get('/:id/students',controller.listStudents);administrativeClassRoutes.post('/:id/students',controller.assignStudent);administrativeClassRoutes.delete('/:id/students/:studentId',controller.removeStudent)
administrativeStudentRoutes.put('/:studentId/administrative-class',controller.moveStudent)
