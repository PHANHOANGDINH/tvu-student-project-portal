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
 const errors={};for(const f of cfg[entity].required)if(!data[f]||Number.isNaN(data[f]))errors[f[0].toLowerCase()+f.slice(1)]=['TrÆ°á»ng nĂ y lĂ  báº¯t buá»™c.']
 if(data.StartDate&&data.EndDate&&new Date(data.StartDate)>=new Date(data.EndDate))errors.endDate=['NgĂ y káº¿t thĂºc pháº£i sau ngĂ y báº¯t Ä‘áº§u.']
 if(data.Code&&await repo.duplicate(entity,'Code',data.Code,id))errors.code=['MĂ£ Ä‘Ă£ tá»“n táº¡i.']
 if(entity==='academicYears'&&data.Name&&await repo.duplicate(entity,'Name',data.Name,id))errors.name=['TĂªn nÄƒm há»c Ä‘Ă£ tá»“n táº¡i.']
 if(data.AcademicYearId&&!await repo.reference('AcademicYears',data.AcademicYearId))errors.academicYearId=['NÄƒm há»c khĂ´ng tá»“n táº¡i.']
 if(data.SubjectId&&!await repo.reference('Subjects',data.SubjectId))errors.subjectId=['MĂ´n há»c khĂ´ng tá»“n táº¡i.']
 if(data.SemesterId&&!await repo.reference('Semesters',data.SemesterId))errors.semesterId=['Há»c ká»³ khĂ´ng tá»“n táº¡i.']
 if(data.LecturerId&&!await repo.reference('Users',data.LecturerId,'LECTURER'))errors.lecturerId=['Giáº£ng viĂªn khĂ´ng tá»“n táº¡i.']
 if(data.Status&&!['ACTIVE','INACTIVE','COMPLETED','CANCELLED'].includes(data.Status))errors.status=['Tráº¡ng thĂ¡i khĂ´ng há»£p lá»‡.']
 return errors
}
export async function list(entity,q){if(!cfg[entity])return result(false,404,'KhĂ´ng tĂ¬m tháº¥y tĂ i nguyĂªn');const p=page(q),r=await repo.listEntities(entity,p);return result(true,200,'Láº¥y danh sĂ¡ch thĂ nh cĂ´ng',{items:r.items,page:p.page,pageSize:p.pageSize,totalItems:r.total,totalPages:Math.ceil(r.total/p.pageSize)})}
export async function detail(entity,id){const key=number(id);if(!key)return result(false,400,'Id khĂ´ng há»£p lá»‡');const item=await repo.findEntity(entity,key);return item?result(true,200,'Láº¥y chi tiáº¿t thĂ nh cĂ´ng',item):result(false,404,'KhĂ´ng tĂ¬m tháº¥y dá»¯ liá»‡u')}
export async function create(entity,body){const data=map(entity,body),errors=await validate(entity,data);if(Object.keys(errors).length)return result(false,400,'Dá»¯ liá»‡u khĂ´ng há»£p lá»‡',null,errors);return result(true,201,'Táº¡o má»›i thĂ nh cĂ´ng',await repo.saveEntity(entity,null,data))}
export async function update(entity,id,body){const key=number(id);if(!key)return result(false,400,'Id khĂ´ng há»£p lá»‡');const current=await repo.findEntity(entity,key);if(!current)return result(false,404,'KhĂ´ng tĂ¬m tháº¥y dá»¯ liá»‡u');const data=map(entity,{...current,...body}),errors=await validate(entity,data,key);if(Object.keys(errors).length)return result(false,400,'Dá»¯ liá»‡u khĂ´ng há»£p lá»‡',null,errors);return result(true,200,'Cáº­p nháº­t thĂ nh cĂ´ng',await repo.saveEntity(entity,key,data))}
export async function status(entity,id,isActive){const key=number(id);if(!key||typeof isActive!=='boolean')return result(false,400,'Tráº¡ng thĂ¡i khĂ´ng há»£p lá»‡');if(!await repo.findEntity(entity,key))return result(false,404,'KhĂ´ng tĂ¬m tháº¥y dá»¯ liá»‡u');return result(true,200,'Cáº­p nháº­t tráº¡ng thĂ¡i thĂ nh cĂ´ng',await repo.setStatus(entity,key,isActive))}
export async function studentList(uid,q){const p=page(q),r=await repo.listStudentClasses(uid,p);return result(true,200,'Láº¥y danh sĂ¡ch lá»›p thĂ nh cĂ´ng',{items:r.items,page:p.page,pageSize:p.pageSize,totalItems:r.total,totalPages:Math.ceil(r.total/p.pageSize)})}
export async function studentDetail(uid,id){const key=number(id);if(!key)return result(false,400,'Id khĂ´ng há»£p lá»‡');const item=await repo.findStudentClass(uid,key);return item?result(true,200,'Láº¥y chi tiáº¿t lá»›p thĂ nh cĂ´ng',item):result(false,404,'KhĂ´ng tĂ¬m tháº¥y lá»›p hoáº·c sinh viĂªn khĂ´ng tham gia lá»›p')}
export async function lecturerList(uid,q){const p=page(q),r=await repo.listLecturerClasses(uid,{...p,status:String(q.status||'').trim().toUpperCase()});return result(true,200,'Láº¥y danh sĂ¡ch lá»›p phá»¥ trĂ¡ch thĂ nh cĂ´ng',{items:r.items,page:p.page,pageSize:p.pageSize,totalItems:r.total,totalPages:Math.ceil(r.total/p.pageSize)})}
export async function lecturerDetail(uid,id){const key=number(id);if(!key)return result(false,400,'Id khĂ´ng há»£p lá»‡');const item=await repo.findLecturerClass(uid,key);return item?result(true,200,'Láº¥y chi tiáº¿t lá»›p thĂ nh cĂ´ng',item):result(false,404,'KhĂ´ng tĂ¬m tháº¥y lá»›p hoáº·c giáº£ng viĂªn khĂ´ng phá»¥ trĂ¡ch lá»›p')}
