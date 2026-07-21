import * as service from './lecturerImport.service.js';
import { sendError,sendSuccess } from '../../utils/apiResponse.util.js';
const send=(res,result)=>result.success?sendSuccess(res,result):sendError(res,result);
export function template(req,res){res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="lecturer-import-template.csv"');res.send(service.templateCsv());}
export async function preview(req,res){try{return send(res,await service.preview(req.file,req.user.id));}catch(error){console.error('Lỗi xem trước CSV giảng viên:',error.message);return sendError(res,{statusCode:500,message:'Không thể kiểm tra file CSV.'});}}
export async function confirm(req,res){try{return send(res,await service.confirm(req.body,req.user.id));}catch(error){console.error('Lỗi nhập giảng viên:',error.message);return sendError(res,{statusCode:500,message:'Không thể nhập giảng viên.'});}}
export async function exportLecturers(req,res){try{res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="lecturers.csv"');return res.send(await service.exportCsv());}catch(error){console.error('Lỗi xuất giảng viên:',error.message);return sendError(res,{statusCode:500,message:'Không thể xuất danh sách giảng viên.'});}}
