import test from "node:test";
import assert from "node:assert/strict";
import sql from "mssql";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { poolPromise } from "../../src/config/db.js";
import {
  cleanupRegressionData, createRecorder, createRegressionContext, createTestFile,
  fileForm, loginAs, lookupDemoUsers, printSummary, requestAs, requestDownload,
} from "./helpers.js";

test("notification ownership, idempotency and topic file security",{timeout:120_000},async()=>{
 const recorder=createRecorder(),context=createRegressionContext();let cleanup;
 try{
  const lecturer=await loginAs(recorder,"thiennhd@tvu.edu.vn",process.env.DEMO_LECTURER_PASSWORD,"LECTURER");
  const lecturerB=await loginAs(recorder,"annb@tvu.edu.vn",process.env.DEMO_LECTURER_PASSWORD,"LECTURER");
  const admin=await loginAs(recorder,"admin.demo@tvu.edu.vn",process.env.DEMO_ADMIN_PASSWORD,"ADMIN");
  const leader=await loginAs(recorder,"sv001@tvu.edu.vn",process.env.DEMO_STUDENT_PASSWORD,"STUDENT");
  const member=await loginAs(recorder,"sv002@tvu.edu.vn",process.env.DEMO_STUDENT_PASSWORD,"STUDENT");
  const outside=await loginAs(recorder,"sv003@tvu.edu.vn",process.env.DEMO_STUDENT_PASSWORD,"STUDENT");
  const users=await lookupDemoUsers(),pool=await poolPromise,now=Date.now(),iso=o=>new Date(now+o).toISOString();
  const year=(await requestAs(recorder,"/academic-years",{token:admin.accessToken,method:"POST",expected:[201],body:{name:`${context.prefix}_YEAR`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const semester=(await requestAs(recorder,"/semesters",{token:admin.accessToken,method:"POST",expected:[201],body:{academicYearId:year.id,name:`${context.prefix}_SEM`,code:`${context.prefix}_SEM`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const subject=(await requestAs(recorder,"/subjects",{token:admin.accessToken,method:"POST",expected:[201],body:{code:`${context.prefix}_SUB`,name:`${context.prefix}_SUBJECT`,credits:3}})).data;
  async function course(lecturerId){return(await requestAs(recorder,"/course-classes",{token:admin.accessToken,method:"POST",expected:[201],body:{subjectId:subject.id,semesterId:semester.id,lecturerId,maxStudents:20,status:"ACTIVE",allowSelfEnrollment:true,enrollmentOpenAt:iso(-86400000),enrollmentCloseAt:iso(86400000)}})).data}
  const classA=await course(users.get("GV001").id),classB=await course(users.get("GV002").id);
  const enroll=(classId,studentIds)=>requestAs(recorder,`/course-classes/${classId}/students/bulk`,{token:admin.accessToken,method:"POST",body:{studentIds}});
  await enroll(classA.id,[users.get("SV001").id,users.get("SV002").id]);await enroll(classB.id,[users.get("SV003").id]);
  const group=(await requestAs(recorder,`/course-classes/${classA.id}/groups`,{token:leader.accessToken,method:"POST",expected:[201],body:{name:`${context.prefix}_GROUP`,maxMembers:5}})).data;
  await requestAs(recorder,`/groups/${group.id}/members`,{token:leader.accessToken,method:"POST",body:{studentId:users.get("SV002").id}});
  const beforeLeader=(await requestAs(recorder,"/notifications/unread-count",{token:leader.accessToken})).data.count;
  const beforeMember=(await requestAs(recorder,"/notifications/unread-count",{token:member.accessToken})).data.count;
  const beforeOutside=(await requestAs(recorder,"/notifications/unread-count",{token:outside.accessToken})).data.count;
  const beforeLecturer=(await requestAs(recorder,"/notifications/unread-count",{token:lecturer.accessToken})).data.count;
  const beforeLecturerB=(await requestAs(recorder,"/notifications/unread-count",{token:lecturerB.accessToken})).data.count;
  const roundBody={classId:classA.id,name:`${context.prefix}_ROUND`,description:"Vòng kiểm thử notification",requirements:"Đăng ký đúng hạn",allowEditing:true,maxEditCount:2,startAt:iso(-3600000),endAt:iso(86400000)};
  const round=(await requestAs(recorder,"/lecturer/topic-rounds",{token:lecturer.accessToken,method:"POST",expected:[201],body:roundBody})).data;
  await requestAs(recorder,`/lecturer/topic-rounds/${round.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"OPEN"}});
  await requestAs(recorder,`/lecturer/topic-rounds/${round.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"OPEN"}});
  const afterLeader=(await requestAs(recorder,"/notifications/unread-count",{token:leader.accessToken})).data.count;
  const afterMember=(await requestAs(recorder,"/notifications/unread-count",{token:member.accessToken})).data.count;
  const afterOutside=(await requestAs(recorder,"/notifications/unread-count",{token:outside.accessToken})).data.count;
  assert.equal(afterLeader,beforeLeader+1);assert.equal(afterMember,beforeMember+1);assert.equal(afterOutside,beforeOutside);
  assert.equal((await requestAs(recorder,"/notifications/unread-count",{token:lecturer.accessToken})).data.count,beforeLecturer);
  assert.equal((await requestAs(recorder,"/notifications/unread-count",{token:lecturerB.accessToken})).data.count,beforeLecturerB);
  const leaderItems=(await requestAs(recorder,"/notifications?pageSize=100",{token:leader.accessToken})).data.items;
  const notice=leaderItems.find(item=>item.type==="TOPIC_ROUND_OPENED"&&item.relatedEntityId===round.id);assert.ok(notice);
  assert.equal(notice.relatedEntityType,"TOPIC_ROUND");assert.ok(!JSON.stringify(notice).match(/password|token|absolute|stack/i));
  const dbNotice=(await pool.request().input("Uid",sql.Int,users.get("SV001").id).input("Key",sql.NVarChar(200),`TOPIC_ROUND_OPENED:${round.id}`).query("SELECT COUNT(*) total,MAX(LEN(EventKey)) keyLength FROM Notifications WHERE UserId=@Uid AND EventKey=@Key")).recordset[0];
  assert.equal(Number(dbNotice.total),1);assert.ok(Number(dbNotice.keyLength)>0&&Number(dbNotice.keyLength)<=200);
  await requestAs(recorder,`/notifications/${notice.id}/read`,{token:member.accessToken,method:"PATCH",expected:[404]});
  await requestAs(recorder,`/notifications/${notice.id}/read`,{token:leader.accessToken,method:"PATCH"});
  assert.equal((await requestAs(recorder,"/notifications/unread-count",{token:leader.accessToken})).data.count,afterLeader-1);
  await requestAs(recorder,`/notifications/${notice.id}/read`,{token:leader.accessToken,method:"PATCH"});
  assert.equal((await requestAs(recorder,"/notifications/unread-count",{token:leader.accessToken})).data.count,afterLeader-1);
  await requestAs(recorder,"/notifications/2147483000/read",{token:leader.accessToken,method:"PATCH",expected:[404]});
  await requestAs(recorder,`/notifications/${notice.id}/read`,{method:"PATCH",expected:[401]});
  await requestAs(recorder,"/notifications/read-all",{token:leader.accessToken,method:"PATCH"});
  await requestAs(recorder,"/notifications/read-all",{token:leader.accessToken,method:"PATCH"});
  assert.equal((await requestAs(recorder,"/notifications/unread-count",{token:leader.accessToken})).data.count,0);

  const fileRound=(await requestAs(recorder,"/lecturer/topic-rounds",{token:lecturer.accessToken,method:"POST",expected:[201],body:{...roundBody,name:`${context.prefix}_FILE_ROUND`}})).data;
  const pdfContent=Buffer.from("%PDF-1.4\nsecurity fixture\n%%EOF");
  const validNames=["bao-cao.pdf","Báo cáo tiến độ tuần 01.pdf","báo.cáo.(bản cuối).pdf","CHU-HOA.PDF"];
  const uploaded=[];
  for(const name of validNames){
   const fixture=await createTestFile(context,name,pdfContent);
   const result=await requestAs(recorder,`/lecturer/topic-rounds/${fileRound.id}/files`,{token:lecturer.accessToken,method:"POST",expected:[201],body:await fileForm(fixture.path,"application/pdf",name)});
   assert.equal(result.data.originalName,name);assert.ok(!Object.hasOwn(result.data,"relativePath")&&!Object.hasOwn(result.data,"absolutePath"));uploaded.push(result.data);
  }
  const firstDownload=await requestDownload(recorder,`/lecturer/topic-rounds/files/${uploaded[1].id}/download`,{token:lecturer.accessToken});
  assert.match(firstDownload.headers.get("content-type")||"",/pdf/);assert.equal(Number(firstDownload.headers.get("content-length")),pdfContent.length);
  const disposition=firstDownload.headers.get("content-disposition")||"";assert.ok(!/[\r\n]/.test(disposition));assert.ok(!disposition.includes(".."));
  await requestDownload(recorder,`/student/topic-rounds/files/${uploaded[0].id}/download`,{token:leader.accessToken});
  await requestDownload(recorder,`/student/topic-rounds/files/${uploaded[0].id}/download`,{token:outside.accessToken,expected:[403]});
  await requestDownload(recorder,`/lecturer/topic-rounds/files/${uploaded[0].id}/download`,{token:lecturerB.accessToken,expected:[403]});

  const invalidCases=[
   ["report.pdf.exe",pdfContent,"application/pdf"],
   ["report.exe.pdf",Buffer.from("plain text"),"application/pdf"],
   ["report.docx.js",Buffer.from([0x50,0x4b,0x03,0x04,1,2,3,4]),"application/javascript"],
   ["fake.pdf",Buffer.from("plain text"),"application/pdf"],
   ["renamed.docx",pdfContent,"application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
   ["wrong-mime.pdf",pdfContent,"text/plain"],
   ["zero.pdf",Buffer.alloc(0),"application/pdf"],
   ["header-only.pdf",Buffer.from("%PDF-"),"application/pdf"],
   ["truncated.pdf",Buffer.from("%PDF-1.4\nmissing eof"),"application/pdf"],
   ["tiny.docx",Buffer.from([0x50,0x4b,0x03,0x04]),"application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
   [`${"a".repeat(261)}.pdf`,pdfContent,"application/pdf"],
  ];
  for(const[name,content,mime]of invalidCases){
   const fixture=await createTestFile(context,"fixture.bin",content);
   await requestAs(recorder,`/lecturer/topic-rounds/${fileRound.id}/files`,{token:lecturer.accessToken,method:"POST",expected:[400],body:await fileForm(fixture.path,mime,name)});
  }
  for(const name of["../outside.pdf","..\\outside.pdf","../../outside.docx","%2e%2e%2foutside.pdf","C:\\outside.pdf","/tmp/outside.pdf"]){
   const fixture=await createTestFile(context,"traversal.pdf",pdfContent);
   const result=await requestAs(recorder,`/lecturer/topic-rounds/${fileRound.id}/files`,{token:lecturer.accessToken,method:"POST",expected:[201,400],body:await fileForm(fixture.path,"application/pdf",name)});
   if(result.status===201){assert.ok(!/[\\/]/.test(result.data.originalName));uploaded.push(result.data)}
  }
  for(const outsidePath of[join(process.cwd(),"outside.pdf"),join(process.cwd(),"..","outside.pdf")])await assert.rejects(access(outsidePath));
  const noAuth=await createTestFile(context,"no-auth.pdf",pdfContent);
  await requestAs(recorder,`/lecturer/topic-rounds/${fileRound.id}/files`,{method:"POST",expected:[401],body:await fileForm(noAuth.path,"application/pdf","no-auth.pdf")});
  await requestAs(recorder,`/lecturer/topic-rounds/${fileRound.id}/files`,{token:member.accessToken,method:"POST",expected:[403],body:await fileForm(noAuth.path,"application/pdf","student.pdf")});
  await requestAs(recorder,`/lecturer/topic-rounds/${fileRound.id}/files`,{token:admin.accessToken,method:"POST",expected:[403],body:await fileForm(noAuth.path,"application/pdf","admin.pdf")});
  const deleteTarget=uploaded.pop();
  await requestAs(recorder,`/lecturer/topic-rounds/files/${deleteTarget.id}`,{token:lecturerB.accessToken,method:"DELETE",expected:[403]});
  await requestAs(recorder,`/lecturer/topic-rounds/files/${deleteTarget.id}`,{token:lecturer.accessToken,method:"DELETE"});
  await requestAs(recorder,`/lecturer/topic-rounds/files/${deleteTarget.id}`,{token:lecturer.accessToken,method:"DELETE",expected:[404]});
  assert.equal(Number((await pool.request().input("Id",sql.Int,fileRound.id).query("SELECT COUNT(*) total FROM TopicRegistrationRoundFiles WHERE RoundId=@Id")).recordset[0].total),uploaded.length);
 }finally{cleanup=await cleanupRegressionData(context);printSummary("notification-file-security",recorder,cleanup)}
});
