import * as repo from'./notifications.repository.js';const ok=(data,message)=>({success:true,statusCode:200,data,message}),fail=(statusCode,message)=>({success:false,statusCode,message});
export const notifyUsers=(ids,data)=>repo.createForUsers(ids,data);export async function notifyGroup(groupId,data){return repo.createForUsers(await repo.groupUsers(groupId),data)}export async function notifyClass(classId,data){return repo.createForUsers(await repo.classStudents(classId),data)}
export async function list(user,q){const page=Math.max(1,Number(q.page)||1),pageSize=Math.min(100,Math.max(1,Number(q.pageSize)||20));return ok({items:await repo.list(user.id,{page,pageSize}),page,pageSize},'Lấy thông báo thành công')}
export async function count(user){return ok({count:await repo.unreadCount(user.id)},'Lấy số thông báo chưa đọc thành công')}
export async function read(id,user){const item=await repo.markRead(Number(id),user.id);return item?ok(item,'Đánh dấu đã đọc thành công'):fail(404,'Không tìm thấy thông báo')}
export async function readAll(user){return ok({updated:await repo.markAll(user.id)},'Đánh dấu tất cả đã đọc thành công')}
