const secure={security:[{bearerAuth:[]}]}
const error={description:'Lỗi API'}
const id=name=>({name,in:'path',required:true,schema:{type:'integer'}})
export const academicEnrollmentSchemas={
 AdministrativeClass:{type:'object',properties:{id:{type:'integer'},classCode:{type:'string'},className:{type:'string'},cohort:{type:'string'},status:{type:'string'},studentCount:{type:'integer'}}},
 AdministrativeClassMembership:{type:'object',properties:{administrativeClassId:{type:'integer'},studentId:{type:'integer'},startAt:{type:'string',format:'date-time'},endAt:{type:'string',format:'date-time',nullable:true},isCurrent:{type:'boolean'},transferReason:{type:'string',nullable:true}}},
}
export const academicEnrollmentPaths={
 '/admin/administrative-classes':{
  get:{...secure,tags:['Administrative classes'],responses:{200:{description:'Danh sách'},401:error,403:error}},
  post:{...secure,tags:['Administrative classes'],responses:{201:{description:'Đã tạo'},400:error,401:error,403:error,409:error}},
 },
 '/admin/administrative-classes/import-template':{get:{...secure,tags:['Administrative classes'],summary:'Tải CSV mẫu',responses:{200:{description:'CSV UTF-8'}}}},
 '/admin/administrative-classes/{id}/import-preview':{post:{...secure,tags:['Administrative classes'],parameters:[id('id')],summary:'Xem trước import CSV tối đa 500 dòng/2 MB',responses:{200:{description:'Kết quả validation'},400:error,409:error}}},
 '/admin/administrative-classes/{id}/import-confirm':{post:{...secure,tags:['Administrative classes'],parameters:[id('id')],summary:'Xác nhận import all-or-nothing',responses:{200:{description:'Đã import'},400:error,409:error}}},
 '/admin/course-classes/{id}/enrollment-preview':{post:{...secure,tags:['Course enrollment'],parameters:[id('id')],summary:'Xem trước ghi danh theo lớp hành chính',responses:{200:{description:'Thống kê và danh sách preview'},400:error,404:error}}},
 '/admin/administrative-classes/transfer':{post:{...secure,tags:['Administrative classes'],summary:'Chuyển lớp hành chính, giữ lịch sử',responses:{200:{description:'Thành công'},400:error,401:error,403:error,409:error}}},
 '/admin/course-classes/{id}/eligible-classes':{
  get:{...secure,tags:['Course enrollment'],parameters:[id('id')],responses:{200:{description:'Danh sách lớp hành chính đủ điều kiện'}}},
  put:{...secure,tags:['Course enrollment'],parameters:[id('id')],responses:{200:{description:'Đã thay thế'}}},
 },
 '/admin/course-classes/{id}/enroll-administrative-classes':{post:{...secure,tags:['Course enrollment'],parameters:[id('id')],responses:{200:{description:'Thống kê ghi danh'},400:error,404:error,409:error}}},
 '/admin/course-classes/transfer':{post:{...secure,tags:['Course enrollment'],summary:'Chuyển enrollment giữa hai lớp cùng môn/học kỳ',responses:{200:{description:'Thành công'},409:error}}},
 '/student/course-class-enrollment/available':{get:{...secure,tags:['Student enrollment'],responses:{200:{description:'Các lớp đang mở và đủ điều kiện'}}}},
 '/student/course-class-enrollment/{id}/enroll':{
  post:{...secure,tags:['Student enrollment'],parameters:[id('id')],responses:{201:{description:'Đã đăng ký'},403:error,409:error}},
  delete:{...secure,tags:['Student enrollment'],parameters:[id('id')],responses:{200:{description:'Đã hủy'},404:error,409:error}},
 },
}
