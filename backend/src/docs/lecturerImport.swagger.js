const secure={security:[{bearerAuth:[]}]},error={description:'Lỗi API'};
export const lecturerImportSwaggerPaths={
 '/admin/lecturers/import-template':{get:{...secure,tags:['Nhập giảng viên'],summary:'Tải file CSV UTF-8 mẫu',responses:{200:{description:'File CSV mẫu'},401:error,403:error}}},
 '/admin/lecturers/import-preview':{post:{...secure,tags:['Nhập giảng viên'],summary:'Kiểm tra CSV giảng viên trước khi ghi dữ liệu',requestBody:{required:true,content:{'multipart/form-data':{schema:{type:'object',required:['file'],properties:{file:{type:'string',format:'binary',description:'CSV UTF-8, tối đa 2 MB và 500 dòng'}}}}}},responses:{200:{description:'Các dòng hợp lệ và lỗi'},400:error,401:error,403:error,413:error}}},
 '/admin/lecturers/import-confirm':{post:{...secure,tags:['Nhập giảng viên'],summary:'Tạo tài khoản LECTURER trong transaction',requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['previewId','mode'],properties:{previewId:{type:'string',format:'uuid'},mode:{type:'string',enum:['atomic']}}}}}},responses:{201:{description:'Nhập thành công'},400:error,401:error,403:error,409:error,410:error}}},
 '/admin/lecturers/export':{get:{...secure,tags:['Nhập giảng viên'],summary:'Xuất danh sách giảng viên CSV an toàn',responses:{200:{description:'CSV UTF-8'},401:error,403:error}}}
};
