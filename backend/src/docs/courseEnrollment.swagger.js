const secure={security:[{bearerAuth:[]}]},error={description:'Lỗi API'},id={name:'id',in:'path',required:true,schema:{type:'integer'}}
export const courseEnrollmentSwaggerPaths={
 '/student/course-class-enrollment/available':{get:{...secure,tags:['Course enrollment'],summary:'Sinh viên xem lớp đang mở đăng ký trực tiếp',responses:{200:{description:'Danh sách lớp'},401:error,403:error}}},
 '/student/course-class-enrollment/{id}':{
  post:{...secure,tags:['Course enrollment'],parameters:[id],summary:'Sinh viên tự đăng ký lớp học phần',responses:{201:{description:'Đã đăng ký'},403:error,404:error,409:error}},
  delete:{...secure,tags:['Course enrollment'],parameters:[id],summary:'Sinh viên hủy đăng ký khi chưa có dữ liệu workflow',responses:{200:{description:'Đã hủy'},404:error,409:error}},
 },
 '/admin/course-enrollments/transfer':{post:{...secure,tags:['Course enrollment'],summary:'Admin chuyển sinh viên giữa hai lớp cùng môn và học kỳ',responses:{200:{description:'Đã chuyển'},400:error,401:error,403:error,404:error,409:error}}},
}
