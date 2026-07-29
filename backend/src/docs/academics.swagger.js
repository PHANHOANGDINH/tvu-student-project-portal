const secure={security:[{bearerAuth:[]}]}
const parameter={name:'id',in:'path',required:true,schema:{type:'integer'}}
function crud(tag){return{list:{...secure,tags:[tag],responses:{200:{description:'Thành công'}}},create:{...secure,tags:[tag],responses:{201:{description:'Đã tạo'}}},detail:{...secure,tags:[tag],parameters:[parameter],responses:{200:{description:'Thành công'},404:{description:'Không tìm thấy'}}},update:{...secure,tags:[tag],parameters:[parameter],responses:{200:{description:'Đã cập nhật'}}},status:{...secure,tags:[tag],parameters:[parameter],responses:{200:{description:'Đã cập nhật trạng thái'}}}}}
const paths={}
for(const [path,tag] of [['/academic-years','Academic years'],['/semesters','Semesters'],['/subjects','Subjects'],['/course-classes','Course classes']]){const c=crud(tag);paths[path]={get:c.list,post:c.create};paths[path+'/{id}']={get:c.detail,put:c.update};paths[path+'/{id}/status']={patch:c.status}}
paths['/student/course-classes']={get:{...secure,tags:['Student course classes'],responses:{200:{description:'Danh sách lớp sinh viên tham gia'}}}}
paths['/student/course-classes/{id}']={get:{...secure,tags:['Student course classes'],parameters:[parameter],responses:{200:{description:'Chi tiết lớp'},404:{description:'Không tham gia lớp'}}}}
export const academicsSwaggerPaths=paths