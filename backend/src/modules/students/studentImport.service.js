import { randomUUID } from 'node:crypto';
import { hashPassword } from '../../utils/password.util.js';
import { createCsv, csvRecords } from '../../utils/csv.util.js';
import { validatePassword } from '../users/users.service.js';
import * as repository from './studentImport.repository.js';

const HEADERS=['studentCode','fullName','email','password'];
const MAX_ROWS=500, PREVIEW_TTL_MS=15*60*1000;
const previews=new Map();
const ok=(data,message,statusCode=200)=>({success:true,statusCode,message,data});
const fail=(statusCode,message,errors=null)=>({success:false,statusCode,message,errors});
const emailValid=(value)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function cleanExpired(){const now=Date.now();for(const[id,item]of previews)if(item.expiresAt<=now)previews.delete(id);}
function initialPassword(){return process.env.INITIAL_STUDENT_PASSWORD||process.env.DEMO_STUDENT_PASSWORD||'';}

export function templateCsv(){return createCsv(HEADERS,[['SV001','Nguyễn Văn A','sv001@example.edu.vn','Student2026']]);}

export async function preview(file,courseClassId,adminId){
  const id=Number(courseClassId);
  if(!Number.isInteger(id)||id<=0)return fail(400,'Lớp học phần không hợp lệ.');
  const courseClass=await repository.findCourseClass(id);
  if(!courseClass)return fail(404,'Không tìm thấy lớp học phần.');
  if(!courseClass.isActive||courseClass.status!=='ACTIVE')return fail(409,'Lớp học phần không hoạt động.');
  if(!file)return fail(400,'Vui lòng chọn file CSV.');
  let records;
  try{
    const text=file.buffer.toString('utf8');
    if(text.includes('\uFFFD'))return fail(400,'File phải sử dụng UTF-8.');
    records=csvRecords(text,HEADERS);
  }catch(error){return fail(400,error.message);}
  if(!records.length)return fail(400,'File CSV không có dòng sinh viên.');
  if(records.length>MAX_ROWS)return fail(413,`File chỉ được tối đa ${MAX_ROWS} dòng.`);
  const fallback=initialPassword(),seenEmails=new Map(),seenCodes=new Map();
  const rows=records.map(({rowNumber,data,extraColumns})=>{
    const studentCode=data.studentCode.toUpperCase(),fullName=data.fullName,email=data.email.toLowerCase();
    const password=data.password||fallback,errors=[];
    if(extraColumns)errors.push('Dòng có cột dư.');
    if(!studentCode)errors.push('Mã sinh viên là bắt buộc.');
    if(!fullName)errors.push('Họ tên là bắt buộc.');
    if(!email)errors.push('Email là bắt buộc.'); else if(!emailValid(email))errors.push('Email không đúng định dạng.');
    if(!password)errors.push('Thiếu password và chưa cấu hình INITIAL_STUDENT_PASSWORD hoặc DEMO_STUDENT_PASSWORD.');
    else errors.push(...validatePassword(password));
    if(email){if(seenEmails.has(email)){errors.push(`Email trùng dòng ${seenEmails.get(email)}.`);}else seenEmails.set(email,rowNumber);}
    if(studentCode){if(seenCodes.has(studentCode)){errors.push(`Mã sinh viên trùng dòng ${seenCodes.get(studentCode)}.`);}else seenCodes.set(studentCode,rowNumber);}
    return{rowNumber,studentCode,fullName,email,password,errors};
  });
  const existing=await repository.findExistingUsers(rows.filter((row)=>row.email&&row.studentCode));
  const emails=new Set(existing.map((item)=>item.email.toLowerCase())),codes=new Set(existing.map((item)=>item.studentCode?.toUpperCase()));
  rows.forEach((row)=>{if(emails.has(row.email))row.errors.push('Email đã tồn tại trong hệ thống.');if(codes.has(row.studentCode))row.errors.push('Mã sinh viên đã tồn tại trong hệ thống.');});
  const validRows=rows.filter((row)=>!row.errors.length),invalidRows=rows.filter((row)=>row.errors.length);
  cleanExpired();const previewId=randomUUID();
  previews.set(previewId,{courseClassId:id,adminId:Number(adminId),rows:validRows,invalidCount:invalidRows.length,expiresAt:Date.now()+PREVIEW_TTL_MS});
  const expose=(row)=>({rowNumber:row.rowNumber,studentCode:row.studentCode,fullName:row.fullName,email:row.email,valid:!row.errors.length,errors:row.errors});
  return ok({previewId,expiresInSeconds:PREVIEW_TTL_MS/1000,courseClass,totalRows:rows.length,validCount:validRows.length,invalidCount:invalidRows.length,rows:rows.map(expose)},'Đã kiểm tra file CSV.');
}

export async function confirm(data={},adminId){
  cleanExpired();
  if(data.mode!=='atomic')return fail(400,'Chỉ hỗ trợ mode atomic (all-or-nothing).');
  const item=previews.get(String(data.previewId||'')),classId=Number(data.courseClassId);
  if(!item)return fail(410,'Bản preview đã hết hạn hoặc không tồn tại.');
  if(item.adminId!==Number(adminId))return fail(403,'Bản preview không thuộc tài khoản hiện tại.');
  if(classId!==item.courseClassId)return fail(400,'Lớp học phần không khớp bản preview.');
  if(item.invalidCount>0)return fail(409,'File còn dòng lỗi; all-or-nothing không cho phép import một phần.');
  if(!item.rows.length)return fail(400,'Không có dòng hợp lệ để import.');
  const rows=await Promise.all(item.rows.map(async(row)=>({...row,passwordHash:await hashPassword(row.password)})));
  try{const result=await repository.importStudents(classId,rows);previews.delete(String(data.previewId));return ok({courseClass:result.courseClass,createdCount:result.created.length,students:result.created},'Import sinh viên và enrollment thành công.',201);}
  catch(error){return fail(error.statusCode||500,error.statusCode?'Import thất bại, toàn bộ transaction đã rollback.':'Không thể import sinh viên.');}
}

export async function bulkEnroll(courseClassId,data={}){
  const ids=Array.isArray(data.studentIds)?[...new Set(data.studentIds.map(Number))]:[];
  if(!ids.length||ids.length>MAX_ROWS||ids.some((id)=>!Number.isInteger(id)||id<=0))return fail(400,`studentIds phải chứa từ 1 đến ${MAX_ROWS} ID hợp lệ.`);
  try{const result=await repository.bulkEnroll(Number(courseClassId),ids);return ok({courseClass:result.courseClass,enrolledCount:result.enrolled.length,skippedCount:result.skipped.length,enrolled:result.enrolled,skipped:result.skipped},'Bulk enrollment hoàn tất.');}
  catch(error){return fail(error.statusCode||500,error.message||'Không thể enrollment sinh viên.');}
}

export async function list(courseClassId,query={}){
  const id=Number(courseClassId),page=Math.max(Number(query.page)||1,1),pageSize=Math.min(Math.max(Number(query.pageSize)||20,1),100);
  if(!Number.isInteger(id)||id<=0)return fail(400,'Lớp học phần không hợp lệ.');
  const courseClass=await repository.findCourseClass(id);if(!courseClass)return fail(404,'Không tìm thấy lớp học phần.');
  const result=await repository.listEnrollments(id,{page,pageSize,search:String(query.search||'').trim()});
  return ok({courseClass,items:result.items,page,pageSize,totalItems:result.total,totalPages:Math.ceil(result.total/pageSize)},'Lấy danh sách sinh viên thành công.');
}

export async function exportCsv(courseClassId){
  const result=await list(courseClassId,{page:1,pageSize:100});if(!result.success)return result;
  const all=await repository.listEnrollments(Number(courseClassId),{page:1,pageSize:Math.max(result.data.totalItems,1)});
  return ok({courseClass:result.data.courseClass,csv:createCsv(['studentCode','fullName','email','enrolledAt'],all.items.map((item)=>[item.studentCode,item.fullName,item.email,item.enrolledAt?.toISOString?.()||item.enrolledAt]))},'Xuất danh sách thành công.');
}
