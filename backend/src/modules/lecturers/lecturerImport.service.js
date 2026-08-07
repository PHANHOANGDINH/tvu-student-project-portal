import { randomUUID } from 'node:crypto';
import { hashPassword } from '../../utils/password.util.js';
import { createCsv, csvRecords, parseCsv } from '../../utils/csv.util.js';
import { validatePassword } from '../users/users.service.js';
import * as repository from './lecturerImport.repository.js';

const LEGACY_HEADERS = ['lecturerCode', 'fullName', 'email', 'password'];
const EXTENDED_HEADERS = [...LEGACY_HEADERS, 'academicDegree'];
const VALID_DEGREES = new Set(['', 'Cử nhân', 'Kỹ sư', 'Thạc sĩ', 'Tiến sĩ']);
const MAX_ROWS = 500, PREVIEW_TTL_MS = 15 * 60 * 1000, previews = new Map();
const ok = (data, message, statusCode = 200) => ({ success: true, statusCode, message, data });
const fail = (statusCode, message, errors = null) => ({ success: false, statusCode, message, errors });
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const fallbackPassword = () => process.env.INITIAL_LECTURER_PASSWORD || process.env.DEMO_LECTURER_PASSWORD || '';
function cleanExpired(){const now=Date.now();for(const[id,item]of previews)if(item.expiresAt<=now)previews.delete(id);}

export function templateCsv(){return createCsv(EXTENDED_HEADERS,[['GV001','Nguyễn Văn A','gv001@tvu.edu.vn','Lecturer2026!','Thạc sĩ']]);}

export async function preview(file,adminId){
  if(!file)return fail(400,'Vui lòng chọn file CSV.');let records;
  try{const text=file.buffer.toString('utf8');if(text.includes('\uFFFD'))return fail(400,'File phải sử dụng UTF-8.');const headers=parseCsv(text)[0]?.map(value=>String(value).trim())||[];records=csvRecords(text,headers.length===EXTENDED_HEADERS.length?EXTENDED_HEADERS:LEGACY_HEADERS);}catch(error){return fail(400,error.message);}
  if(!records.length)return fail(400,'File CSV không có dòng giảng viên.');if(records.length>MAX_ROWS)return fail(413,`File chỉ được tối đa ${MAX_ROWS} dòng.`);
  const fallback=fallbackPassword(),seenEmails=new Map(),seenCodes=new Map();
  const rows=records.map(({rowNumber,data,extraColumns})=>{const lecturerCode=data.lecturerCode.toUpperCase(),fullName=data.fullName,email=data.email.toLowerCase(),password=data.password||fallback,academicDegree=String(data.academicDegree||'').trim(),errors=[];if(extraColumns)errors.push('Dòng có cột dư.');if(!lecturerCode)errors.push('Mã giảng viên là bắt buộc.');if(!fullName)errors.push('Họ và tên là bắt buộc.');if(!email)errors.push('Email là bắt buộc.');else if(!validEmail(email))errors.push('Email không đúng định dạng.');if(!VALID_DEGREES.has(academicDegree))errors.push('Học vị phải là Cử nhân, Kỹ sư, Thạc sĩ hoặc Tiến sĩ.');if(!password)errors.push('Thiếu mật khẩu và chưa cấu hình mật khẩu khởi tạo.');else errors.push(...validatePassword(password));if(email){if(seenEmails.has(email))errors.push(`Email trùng dòng ${seenEmails.get(email)}.`);else seenEmails.set(email,rowNumber);}if(lecturerCode){if(seenCodes.has(lecturerCode))errors.push(`Mã giảng viên trùng dòng ${seenCodes.get(lecturerCode)}.`);else seenCodes.set(lecturerCode,rowNumber);}return{rowNumber,lecturerCode,fullName,email,password,academicDegree,errors};});
  const existing=await repository.findExisting(rows.filter(row=>row.email&&row.lecturerCode)),emails=new Set(existing.map(item=>item.email.toLowerCase())),codes=new Set(existing.map(item=>item.lecturerCode?.toUpperCase()));rows.forEach(row=>{if(emails.has(row.email))row.errors.push('Email đã tồn tại trong hệ thống.');if(codes.has(row.lecturerCode))row.errors.push('Mã giảng viên đã tồn tại trong hệ thống.');});
  const validRows=rows.filter(row=>!row.errors.length),invalidRows=rows.filter(row=>row.errors.length);cleanExpired();const previewId=randomUUID();previews.set(previewId,{adminId:Number(adminId),rows:validRows,invalidCount:invalidRows.length,expiresAt:Date.now()+PREVIEW_TTL_MS});const expose=row=>({rowNumber:row.rowNumber,lecturerCode:row.lecturerCode,fullName:row.fullName,email:row.email,academicDegree:row.academicDegree,valid:!row.errors.length,errors:row.errors});return ok({previewId,expiresInSeconds:PREVIEW_TTL_MS/1000,totalRows:rows.length,validCount:validRows.length,invalidCount:invalidRows.length,rows:rows.map(expose)},'Đã kiểm tra file CSV.');
}

export async function confirm(data,adminId){cleanExpired();if(data?.mode!=='atomic')return fail(400,'Chỉ hỗ trợ chế độ toàn bộ hoặc không có gì.');const item=previews.get(String(data?.previewId||''));if(!item)return fail(410,'Bản xem trước đã hết hạn hoặc không tồn tại.');if(item.adminId!==Number(adminId))return fail(403,'Bản xem trước không thuộc tài khoản hiện tại.');if(item.invalidCount)return fail(409,'File còn dòng lỗi nên chưa thể nhập.');const rows=await Promise.all(item.rows.map(async row=>({...row,passwordHash:await hashPassword(row.password)})));try{const created=await repository.importLecturers(rows);previews.delete(String(data.previewId));return ok({createdCount:created.length,lecturers:created},'Nhập danh sách giảng viên thành công.',201);}catch(error){return fail(error.statusCode||500,error.statusCode?'Nhập thất bại, toàn bộ transaction đã rollback.':'Không thể nhập giảng viên.');}}
export async function exportCsv(filters={}){const rows=await repository.listLecturers(filters);return createCsv(['lecturerCode','fullName','email','faculty','academicDegree','status'],rows.map(row=>[row.lecturerCode,row.fullName,row.email,row.department,row.academicDegree,row.isActive?'ACTIVE':'INACTIVE']));}
