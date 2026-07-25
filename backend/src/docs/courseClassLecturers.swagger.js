const secure={security:[{bearerAuth:[]}],tags:['Course class lecturers']}
const id=name=>({name,in:'path',required:true,schema:{type:'integer'}})
const error={description:'Lỗi nghiệp vụ',content:{'application/json':{schema:{$ref:'#/components/schemas/ApiError'}}}}
const assignmentBody={required:true,content:{'application/json':{schema:{type:'object',required:['lecturerId','assignmentRole'],properties:{lecturerId:{type:'integer'},assignmentRole:{$ref:'#/components/schemas/AssignmentRole'}}}}}}

export const courseClassLecturerSchemas={
  AssignmentRole:{type:'string',enum:['PRIMARY','CO_LECTURER'],description:'PRIMARY là giảng viên chính; CO_LECTURER là giảng viên phối hợp.'},
  CourseClassLecturer:{type:'object',properties:{id:{type:'integer'},courseClassId:{type:'integer'},lecturerId:{type:'integer'},code:{type:'string'},fullName:{type:'string'},email:{type:'string',format:'email'},assignmentRole:{$ref:'#/components/schemas/AssignmentRole'},assignmentRoleLabel:{type:'string'},isActive:{type:'boolean'},assignedBy:{type:'integer',nullable:true},assignedAt:{type:'string',format:'date-time'},updatedAt:{type:'string',format:'date-time',nullable:true}}},
  CourseClassWithLecturers:{type:'object',description:'Một lớp có nhiều giảng viên nhưng tối đa một PRIMARY active. Một giảng viên có thể dạy nhiều lớp cùng học kỳ.',properties:{id:{type:'integer'},code:{type:'string'},lecturerId:{type:'integer',nullable:true,deprecated:true},lecturerName:{type:'string',nullable:true,deprecated:true},lecturers:{type:'array',items:{$ref:'#/components/schemas/CourseClassLecturer'}}}},
}

export const courseClassLecturerPaths={
  '/admin/course-classes/{courseClassId}/lecturers':{
    get:{...secure,summary:'Danh sách giảng viên của lớp',parameters:[id('courseClassId')],responses:{200:{description:'Thành công'},401:error,403:error,404:error}},
    post:{...secure,summary:'Phân công một giảng viên',parameters:[id('courseClassId')],requestBody:assignmentBody,responses:{201:{description:'Đã phân công'},400:error,401:error,403:error,404:error,409:error}},
    put:{...secure,summary:'Thay thế toàn bộ phân công bằng transaction',parameters:[id('courseClassId')],requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['lecturers'],properties:{lecturers:{type:'array',items:{type:'object',required:['lecturerId','assignmentRole'],properties:{lecturerId:{type:'integer'},assignmentRole:{$ref:'#/components/schemas/AssignmentRole'}}}}}}}}},responses:{200:{description:'Đã cập nhật'},400:error,401:error,403:error,404:error,409:error}},
  },
  '/admin/course-classes/{courseClassId}/lecturers/{lecturerId}':{
    patch:{...secure,summary:'Cập nhật vai trò/trạng thái phân công',parameters:[id('courseClassId'),id('lecturerId')],requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{assignmentRole:{$ref:'#/components/schemas/AssignmentRole'},isActive:{type:'boolean'}}}}}},responses:{200:{description:'Đã cập nhật'},400:error,401:error,403:error,404:error,409:error}},
    delete:{...secure,summary:'Gỡ phân công',description:'Có thể để lớp tạm thời chưa có PRIMARY.',parameters:[id('courseClassId'),id('lecturerId')],responses:{200:{description:'Đã gỡ'},401:error,403:error,404:error}},
  },
}
