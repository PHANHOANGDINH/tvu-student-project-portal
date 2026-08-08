const secure={security:[{bearerAuth:[]}]},error={description:'Lỗi API'},id={name:'id',in:'path',required:true,schema:{type:'integer'}}
const crud=(path,tag)=>({
 [`/admin/${path}`]:{get:{...secure,tags:[tag],summary:`Danh sách ${tag.toLowerCase()}`,responses:{200:{description:'Thành công'},401:error,403:error}},post:{...secure,tags:[tag],summary:`Tạo ${tag.toLowerCase()}`,responses:{201:{description:'Đã tạo'},400:error,401:error,403:error,409:error}}},
 [`/admin/${path}/{id}`]:{get:{...secure,tags:[tag],parameters:[id],responses:{200:{description:'Thành công'},404:error}},put:{...secure,tags:[tag],parameters:[id],responses:{200:{description:'Đã cập nhật'},400:error,404:error,409:error}},delete:{...secure,tags:[tag],parameters:[id],responses:{200:{description:'Đã xóa'},404:error,409:error}}},
 [`/admin/${path}/{id}/status`]:{patch:{...secure,tags:[tag],parameters:[id],responses:{200:{description:'Đã cập nhật trạng thái'},400:error,404:error}}}
})
export const organizationSwaggerPaths={...crud('faculties','Khoa'),...crud('administrative-classes','Lớp hành chính'),
 '/admin/administrative-classes/{id}/students':{get:{...secure,tags:['Lớp hành chính'],parameters:[id],responses:{200:{description:'Danh sách sinh viên'}}},post:{...secure,tags:['Lớp hành chính'],parameters:[id],responses:{201:{description:'Đã gán hoặc chuyển sinh viên'},400:error,404:error,409:error}}},
 '/admin/administrative-classes/{id}/students/{studentId}':{delete:{...secure,tags:['Lớp hành chính'],parameters:[id,{name:'studentId',in:'path',required:true,schema:{type:'integer'}}],responses:{200:{description:'Đã xóa khỏi lớp'},404:error}}},
 '/admin/students/{studentId}/administrative-class':{put:{...secure,tags:['Lớp hành chính'],parameters:[{name:'studentId',in:'path',required:true,schema:{type:'integer'}}],responses:{200:{description:'Đã chuyển lớp'},400:error,404:error,409:error}}}}
