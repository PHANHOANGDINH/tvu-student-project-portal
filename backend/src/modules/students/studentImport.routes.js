import express from 'express';
import multer from 'multer';
import auth from '../../middlewares/auth.middleware.js';
import role from '../../middlewares/role.middleware.js';
import { USER_ROLES } from '../../constants/roles.js';
import * as controller from './studentImport.controller.js';

const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024,files:1},fileFilter(req,file,callback){const csvName=file.originalname.toLowerCase().endsWith('.csv');const csvType=['text/csv','application/csv','application/vnd.ms-excel'].includes(file.mimetype);callback(csvName&&csvType?null:new multer.MulterError('LIMIT_UNEXPECTED_FILE','file'),csvName&&csvType);}});
const csvUpload=(req,res,next)=>upload.single('file')(req,res,(error)=>{if(!error)return next();const status=error.code==='LIMIT_FILE_SIZE'?413:400;return res.status(status).json({success:false,message:error.code==='LIMIT_FILE_SIZE'?'File CSV vượt quá 2 MB.':'Chỉ chấp nhận một file .csv.',data:null,errors:null});});

export const adminStudentImportRoutes=express.Router();
adminStudentImportRoutes.use(auth,role(USER_ROLES.ADMIN));
adminStudentImportRoutes.get('/import-template',controller.template);
adminStudentImportRoutes.post('/import-preview',csvUpload,controller.preview);
adminStudentImportRoutes.post('/import-confirm',controller.confirm);

export const courseClassStudentRoutes=express.Router({mergeParams:true});
courseClassStudentRoutes.use(auth,role(USER_ROLES.ADMIN));
courseClassStudentRoutes.get('/',controller.list);
courseClassStudentRoutes.get('/export',controller.exportStudents);
courseClassStudentRoutes.post('/bulk',controller.bulk);
