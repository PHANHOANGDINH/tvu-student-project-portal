import * as repo from './academics.repository.js'
const cfg={
 academicYears:{required:['Name','StartDate','EndDate'],fields:['Name','StartDate','EndDate']},
 semesters:{required:['AcademicYearId','Name','Code','StartDate','EndDate'],fields:['AcademicYearId','Name','Code','StartDate','EndDate']},
 subjects:{required:['Code','Name','Credits'],fields:['Code','Name','Credits','Description']},
 courseClasses:{required:['Code','SubjectId','SemesterId','Status'],fields:['Code','SubjectId','SemesterId','LecturerId','MaxStudents','Status']}
}
const result=(success,statusCode,message,data=null,errors=null)=>({success,statusCode,message,data,errors})
const number=(v,optional=false)=>optional&&(v===null||v===''||v===undefined)?null:(Number.isInteger(Number(v))&&Number(v)>0?Number(v):NaN)
const page=q=>({page:number(q.page)||1,pageSize:Math.min(number(q.pageSize||q.limit)||10,100),search:String(q.search||'').trim()})
function map(entity,body){const data={};for(const f of cfg[entity].fields){const k=f[0].toLowerCase()+f.slice(1);if(!(k in body))continue;if(f.endsWith('Id')||f==='Credits'||f==='MaxStudents')data[f]=number(body[k],f==='LecturerId'||f==='MaxStudents');else data[f]=String(body[k]??'').trim();if(f==='Code'||f==='Status')data[f]=data[f].toUpperCase()}return data}
async function validate(entity,data,id){
 const errors={};for(const f of cfg[entity].required)if(!data[f]||Number.isNaN(data[f]))errors[f[0].toLowerCase()+f.slice(1)]=['Trường này là bắt buộc.']
 if(data.StartDate&&data.EndDate&&new Date(data.StartDate)>=new Date(data.EndDate))errors.endDate=['Ngày kết thúc phải sau ngày bắt đầu.']
 if(data.Code&&await repo.duplicate(entity,'Code',data.Code,id))errors.code=['Mã đã tồn tại.']
 if(entity==='academicYears'&&data.Name&&await repo.duplicate(entity,'Name',data.Name,id))errors.name=['Tên năm học đã tồn tại.']
 if(data.AcademicYearId&&!await repo.reference('AcademicYears',data.AcademicYearId))errors.academicYearId=['Năm học không tồn tại.']
 if(data.SubjectId&&!await repo.reference('Subjects',data.SubjectId))errors.subjectId=['Môn học không tồn tại.']
 if(data.SemesterId&&!await repo.reference('Semesters',data.SemesterId))errors.semesterId=['Học kỳ không tồn tại.']
 if(data.LecturerId&&!await repo.reference('Users',data.LecturerId,'LECTURER'))errors.lecturerId=['Giảng viên không tồn tại.']
 if(data.Status&&!['ACTIVE','INACTIVE','COMPLETED','CANCELLED'].includes(data.Status))errors.status=['Trạng thái không hợp lệ.']
 return errors
}
export async function list(entity,q){if(!cfg[entity])return result(false,404,'Không tìm thấy tài nguyên');const p=page(q),r=await repo.listEntities(entity,p);return result(true,200,'Lấy danh sách thành công',{items:r.items,page:p.page,pageSize:p.pageSize,totalItems:r.total,totalPages:Math.ceil(r.total/p.pageSize)})}
export async function detail(entity,id){const key=number(id);if(!key)return result(false,400,'Id không hợp lệ');const item=await repo.findEntity(entity,key);return item?result(true,200,'Lấy chi tiết thành công',item):result(false,404,'Không tìm thấy dữ liệu')}
export async function create(entity,body){const data=map(entity,body),errors=await validate(entity,data);if(Object.keys(errors).length)return result(false,400,'Dữ liệu không hợp lệ',null,errors);return result(true,201,'Tạo mới thành công',await repo.saveEntity(entity,null,data))}
export async function update(entity,id,body){const key=number(id);if(!key)return result(false,400,'Id không hợp lệ');const current=await repo.findEntity(entity,key);if(!current)return result(false,404,'Không tìm thấy dữ liệu');const data=map(entity,{...current,...body}),errors=await validate(entity,data,key);if(Object.keys(errors).length)return result(false,400,'Dữ liệu không hợp lệ',null,errors);return result(true,200,'Cập nhật thành công',await repo.saveEntity(entity,key,data))}
export async function status(entity,id,isActive){const key=number(id);if(!key||typeof isActive!=='boolean')return result(false,400,'Trạng thái không hợp lệ');if(!await repo.findEntity(entity,key))return result(false,404,'Không tìm thấy dữ liệu');return result(true,200,'Cập nhật trạng thái thành công',await repo.setStatus(entity,key,isActive))}
export async function studentList(uid,q){const p=page(q),r=await repo.listStudentClasses(uid,p);return result(true,200,'Lấy danh sách lớp thành công',{items:r.items,page:p.page,pageSize:p.pageSize,totalItems:r.total,totalPages:Math.ceil(r.total/p.pageSize)})}
export async function studentDetail(uid,id){const key=number(id);if(!key)return result(false,400,'Id không hợp lệ');const item=await repo.findStudentClass(uid,key);return item?result(true,200,'Lấy chi tiết lớp thành công',item):result(false,404,'Không tìm thấy lớp hoặc sinh viên không tham gia lớp')}
