import express from 'express'
import auth from '../../middlewares/auth.middleware.js'
import role from '../../middlewares/role.middleware.js'
import { USER_ROLES } from '../../constants/roles.js'
import * as controller from './courseClassLecturers.controller.js'
const router=express.Router({mergeParams:true})
router.use(auth,role(USER_ROLES.ADMIN))
router.get('/',controller.list)
router.post('/',controller.assign)
router.put('/',controller.bulk)
router.patch('/:lecturerId',controller.update)
router.delete('/:lecturerId',controller.remove)
export default router
