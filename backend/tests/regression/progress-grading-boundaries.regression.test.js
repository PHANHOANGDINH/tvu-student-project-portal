import test from "node:test";
import assert from "node:assert/strict";
import sql from "mssql";
import { readFile, rm } from "node:fs/promises";
import { poolPromise } from "../../src/config/db.js";
import { resolveStoredFile } from "../../src/services/fileStorage.service.js";
import {
  cleanupRegressionData, createRecorder, createRegressionContext, createTestFile,
  loginAs, lookupDemoUsers, printSummary, requestAs, requestDownload,
} from "./helpers.js";

test("progress terminal states, optional items, inactive enrollment and cross-course grading",{timeout:120_000},async()=>{
 const recorder=createRecorder(),context=createRegressionContext();let cleanup;
 try{
  const lecturer=await loginAs(recorder,"thiennhd@tvu.edu.vn",process.env.DEMO_LECTURER_PASSWORD,"LECTURER");
  const lecturerB=await loginAs(recorder,"annb@tvu.edu.vn",process.env.DEMO_LECTURER_PASSWORD,"LECTURER");
  const admin=await loginAs(recorder,"admin.demo@tvu.edu.vn",process.env.DEMO_ADMIN_PASSWORD,"ADMIN");
  const leader=await loginAs(recorder,"sv001@tvu.edu.vn",process.env.DEMO_STUDENT_PASSWORD,"STUDENT");
  const member=await loginAs(recorder,"sv002@tvu.edu.vn",process.env.DEMO_STUDENT_PASSWORD,"STUDENT");
  const users=await lookupDemoUsers(),pool=await poolPromise,now=Date.now(),iso=o=>new Date(now+o).toISOString();
  const year=(await requestAs(recorder,"/academic-years",{token:admin.accessToken,method:"POST",expected:[201],body:{name:`${context.prefix}_YEAR`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const semester=(await requestAs(recorder,"/semesters",{token:admin.accessToken,method:"POST",expected:[201],body:{academicYearId:year.id,name:`${context.prefix}_SEM`,code:`${context.prefix}_SEM`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const subject=(await requestAs(recorder,"/subjects",{token:admin.accessToken,method:"POST",expected:[201],body:{code:`${context.prefix}_SUB`,name:`${context.prefix}_SUBJECT`,credits:3}})).data;
  async function course(lecturerId){return(await requestAs(recorder,"/course-classes",{token:admin.accessToken,method:"POST",expected:[201],body:{subjectId:subject.id,semesterId:semester.id,lecturerId,maxStudents:20,status:"ACTIVE",allowSelfEnrollment:true,enrollmentOpenAt:iso(-86400000),enrollmentCloseAt:iso(86400000)}})).data}
  const classA=await course(users.get("GV001").id),classB=await course(users.get("GV002").id),classInactive=await course(users.get("GV001").id);
  const enroll=(classId,studentIds)=>requestAs(recorder,`/course-classes/${classId}/students/bulk`,{token:admin.accessToken,method:"POST",body:{studentIds}});
  await enroll(classA.id,[users.get("SV001").id,users.get("SV002").id]);await enroll(classB.id,[users.get("SV001").id]);
  const groupA=(await requestAs(recorder,`/course-classes/${classA.id}/groups`,{token:leader.accessToken,method:"POST",expected:[201],body:{name:`${context.prefix}_GROUP_A`,maxMembers:5}})).data;
  await requestAs(recorder,`/groups/${groupA.id}/members`,{token:leader.accessToken,method:"POST",body:{studentId:users.get("SV002").id}});
  const groupB=(await requestAs(recorder,`/course-classes/${classB.id}/groups`,{token:leader.accessToken,method:"POST",expected:[201],body:{name:`${context.prefix}_GROUP_B`,maxMembers:5}})).data;
  const items=[
   {type:"TEXT_SUMMARY",name:"Tóm tắt",description:"Bắt buộc",isRequired:true,displayOrder:1},
   {type:"BLOCKERS",name:"Khó khăn",description:"Không bắt buộc",isRequired:false,displayOrder:2},
   {type:"OTHER_URL",name:"Liên kết khác",description:"Không bắt buộc",isRequired:false,displayOrder:3},
   {type:"REPORT_FILE",name:"Tệp minh chứng",description:"Không bắt buộc",isRequired:false,displayOrder:4,maxFiles:1},
  ];
  const requirementBody=(classId,title)=>({classId,title,description:"Ma trận trạng thái tiến độ",instructions:"Kiểm thử regression",startAt:iso(-3600000),deadline:iso(86400000),allowLate:false,allowResubmission:true,maxAttempts:3,maxFileSizeMb:2,requirementType:"WEEKLY_PROGRESS",weekNumber:8,requiredItems:items});
  const requirement=(await requestAs(recorder,"/lecturer/submission-requirements",{token:lecturer.accessToken,method:"POST",expected:[201],body:requirementBody(classA.id,`${context.prefix}_OPTIONAL`)})).data;
  await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"OPEN"}});
  const itemMap=new Map(requirement.requiredItems.map(x=>[x.type,x]));
  async function submitForm(label,{optionalText="",optionalUrl="",file=null}={}){
   const responses=[{itemId:itemMap.get("TEXT_SUMMARY").id,value:`Tóm tắt ${label}`},{itemId:itemMap.get("BLOCKERS").id,value:optionalText},{itemId:itemMap.get("OTHER_URL").id,value:optionalUrl}];
   const form=new FormData();form.append("responses",JSON.stringify(responses));
   if(file)form.append(`item_${itemMap.get("REPORT_FILE").id}`,new Blob([await readFile(file.path)],{type:"application/pdf"}),file.name);
   return form;
  }
  const first=(await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[201],body:await submitForm("lần 1")})).data;
  assert.equal(first.attempts[0].responses.length,1);assert.equal(first.attempts[0].files.length,0);

  const metadata={...requirementBody(classA.id,`${context.prefix}_OPTIONAL_UPDATED`),description:"Metadata đã cập nhật",deadline:iso(172800000),weekNumber:9};
  const metadataResult=(await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}`,{token:lecturer.accessToken,method:"PUT",body:metadata})).data;
  assert.equal(metadataResult.title,metadata.title);assert.equal(metadataResult.weekNumber,9);assert.deepEqual(metadataResult.requiredItems.map(x=>x.id),requirement.requiredItems.map(x=>x.id));
  for(const changed of[
   {...metadata,requiredItems:[...items,{type:"NEXT_PLAN",name:"Kế hoạch",isRequired:false,displayOrder:5}]},
   {...metadata,requiredItems:items.slice(1)},
   {...metadata,requiredItems:items.map((x,i)=>i?x:{...x,type:"COMPLETED_TASKS"})},
   {...metadata,requiredItems:items.map((x,i)=>i===1?{...x,isRequired:true}:x)},
   {...metadata,requiredItems:items.map((x,i)=>({...x,displayOrder:i+10}))},
  ])await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}`,{token:lecturer.accessToken,method:"PUT",expected:[409],body:changed});
  assert.equal(Number((await pool.request().input("Id",sql.Int,requirement.id).query("SELECT COUNT(*) total FROM SubmissionItemResponses x JOIN RequiredSubmissionItems i ON i.Id=x.RequiredSubmissionItemId WHERE i.RequirementId=@Id")).recordset[0].total),1);

  const revision1=(await requestAs(recorder,`/lecturer/submissions/${first.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"REQUIRES_REVISION",comment:"Bổ sung lần một"}})).data;
  assert.equal(revision1.status,"REQUIRES_REVISION");
  await requestAs(recorder,`/lecturer/submissions/${first.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"REQUIRES_REVISION",comment:"Retry không tạo lịch sử"}});
  const evidence=await createTestFile(context,"Minh chứng lần 2.pdf",Buffer.from("%PDF-1.4\noptional evidence\n%%EOF"));evidence.name="Minh chứng lần 2.pdf";
  const second=(await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[201],body:await submitForm("lần 2",{optionalText:"Đã xử lý khó khăn",optionalUrl:"https://example.test/optional",file:evidence})})).data;
  assert.equal(second.latestAttemptNumber,2);assert.equal(second.attempts[0].responses.length,4);assert.equal(second.attempts[1].responses.length,1);
  await requestAs(recorder,`/lecturer/submissions/${first.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"REQUIRES_REVISION",comment:"Chu kỳ chỉnh sửa thứ hai"}});
  const third=(await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[201],body:await submitForm("lần 3")})).data;
  assert.deepEqual(third.attempts.map(x=>x.attemptNumber),[3,2,1]);assert.equal(third.attempts[0].responses.length,1);
  const reviewHistory=(await requestAs(recorder,`/student/submissions/${first.id}/review-history`,{token:leader.accessToken})).data;
  assert.equal(reviewHistory.filter(x=>x.eventType==="STATUS_CHANGED"&&x.toStatus==="REQUIRES_REVISION").length,2);
  const revisionNotices=(await requestAs(recorder,"/notifications?pageSize=100",{token:leader.accessToken})).data.items.filter(x=>x.relatedEntityId===first.id&&x.type==="PROGRESS_REVIEWED");
  assert.equal(revisionNotices.length,2);

  await requestAs(recorder,`/lecturer/submissions/${first.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"COMPLETED",comment:"Hoàn thành"}});
  await requestAs(recorder,`/lecturer/submissions/${first.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"COMPLETED",comment:"Retry"}});
  await requestAs(recorder,`/lecturer/submissions/${first.id}/status`,{token:lecturer.accessToken,method:"PATCH",expected:[409],body:{status:"REQUIRES_REVISION",comment:"Không được quay lại"}});
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[409],body:await submitForm("sau hoàn thành")});
  const completedHistory=(await requestAs(recorder,`/lecturer/submissions/${first.id}/review`,{token:lecturer.accessToken})).data.history;
  assert.equal(completedHistory.filter(x=>x.toStatus==="COMPLETED").length,1);

  const c1=(await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}/criteria`,{token:lecturer.accessToken,method:"POST",expected:[201],body:{name:"Nội dung",maxScore:6,displayOrder:1}})).data;
  const c2=(await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}/criteria`,{token:lecturer.accessToken,method:"POST",expected:[201],body:{name:"Minh chứng",maxScore:4,displayOrder:2}})).data;
  const draft1=(await requestAs(recorder,`/lecturer/submissions/${first.id}/grade`,{token:lecturer.accessToken,method:"POST",body:{scores:[{criterionId:c1.id,score:5,comment:"Bản đầu"},{criterionId:c2.id,score:3}],isPublished:false}})).data;
  const draft2=(await requestAs(recorder,`/lecturer/submissions/${first.id}/grade`,{token:lecturer.accessToken,method:"PUT",body:{scores:[{criterionId:c1.id,score:5.5,comment:"Đã cập nhật"},{criterionId:c2.id,score:3.5}],isPublished:false}})).data;
  assert.equal(draft1.grade.id,draft2.grade.id);assert.equal(Number(draft2.grade.totalScore),9);
  await requestAs(recorder,`/lecturer/submissions/${first.id}/grade`,{token:lecturer.accessToken,method:"PUT",body:{scores:[{criterionId:c1.id,score:6},{criterionId:c2.id,score:3.5}],isPublished:true}});
  await requestAs(recorder,`/lecturer/evaluation-criteria/${c1.id}`,{token:lecturer.accessToken,method:"PUT",expected:[409],body:{name:"Không được sửa",maxScore:6}});
  await requestAs(recorder,`/lecturer/evaluation-criteria/${c1.id}`,{token:lecturer.accessToken,method:"DELETE",expected:[409]});
  await requestAs(recorder,`/lecturer/submissions/${first.id}/grade`,{token:lecturer.accessToken,method:"PUT",expected:[409],body:{totalScore:10,isPublished:true}});
  await requestAs(recorder,`/lecturer/submissions/${first.id}/status`,{token:lecturer.accessToken,method:"PATCH",expected:[409],body:{status:"COMPLETED"}});
  assert.equal(Number((await requestAs(recorder,`/student/submissions/${first.id}/result`,{token:member.accessToken})).data.grade.totalScore),9.5);

  const missingFile=third.attempts.find(x=>x.attemptNumber===2).responses.find(x=>x.type==="REPORT_FILE");
  const stored=(await pool.request().input("Id",sql.Int,missingFile.fileId).query("SELECT RelativePath path FROM SubmissionFiles WHERE Id=@Id")).recordset[0];
  await rm(resolveStoredFile(stored.path),{force:true});
  const missing=await requestAs(recorder,`/student/submission-files/${missingFile.fileId}/download`,{token:leader.accessToken,expected:[410]});
  assert.equal(missing.payload.message,"Tệp đính kèm không còn tồn tại trên hệ thống.");
  await requestDownload(recorder,`/student/submission-files/${missingFile.fileId}/download`,{token:member.accessToken,expected:[410]});

  const notMet=(await requestAs(recorder,"/lecturer/submission-requirements",{token:lecturer.accessToken,method:"POST",expected:[201],body:{...requirementBody(classA.id,`${context.prefix}_NOT_MET`),requiredItems:[items[0]]}})).data;
  await requestAs(recorder,`/lecturer/submission-requirements/${notMet.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"OPEN"}});
  const notMetItem=notMet.requiredItems[0],notMetForm=new FormData();notMetForm.append("responses",JSON.stringify([{itemId:notMetItem.id,value:"Không đạt"}]));
  const notMetSubmission=(await requestAs(recorder,`/student/submission-requirements/${notMet.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[201],body:notMetForm})).data;
  await requestAs(recorder,`/lecturer/submissions/${notMetSubmission.id}/status`,{token:lecturer.accessToken,method:"PATCH",expected:[400],body:{status:"NOT_MET",comment:""}});
  await requestAs(recorder,`/lecturer/submissions/${notMetSubmission.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"NOT_MET",comment:"Chưa đáp ứng yêu cầu"}});
  await requestAs(recorder,`/lecturer/submissions/${notMetSubmission.id}/grade`,{token:lecturer.accessToken,method:"POST",expected:[409],body:{totalScore:3,isPublished:false}});
  const notMetRetry=new FormData();notMetRetry.append("responses",JSON.stringify([{itemId:notMetItem.id,value:"Retry"}]));
  await requestAs(recorder,`/student/submission-requirements/${notMet.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[409],body:notMetRetry});

  const cross=(await requestAs(recorder,"/lecturer/submission-requirements",{token:lecturerB.accessToken,method:"POST",expected:[201],body:{...requirementBody(classB.id,`${context.prefix}_CROSS`),requiredItems:[items[0]]}})).data;
  await requestAs(recorder,`/lecturer/submission-requirements/${cross.id}/status`,{token:lecturerB.accessToken,method:"PATCH",body:{status:"OPEN"}});
  const crossForm=new FormData();crossForm.append("responses",JSON.stringify([{itemId:cross.requiredItems[0].id,value:"Lớp B"}]));
  const crossSubmission=(await requestAs(recorder,`/student/submission-requirements/${cross.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[201],body:crossForm})).data;
  await requestAs(recorder,`/lecturer/submissions/${crossSubmission.id}/grade`,{token:lecturer.accessToken,method:"POST",expected:[403],body:{totalScore:8,isPublished:true}});
  await requestAs(recorder,`/lecturer/submissions/${crossSubmission.id}/grade`,{token:lecturerB.accessToken,method:"POST",expected:[400],body:{scores:[{criterionId:c1.id,score:5},{criterionId:c2.id,score:3}],isPublished:false}});
  await requestAs(recorder,`/lecturer/submissions/${crossSubmission.id}/grade`,{token:lecturerB.accessToken,method:"POST",body:{totalScore:8,isPublished:true}});
  assert.equal(Number((await requestAs(recorder,`/student/submissions/${crossSubmission.id}/result`,{token:leader.accessToken})).data.grade.totalScore),8);
  assert.equal(Number((await requestAs(recorder,`/student/submissions/${first.id}/result`,{token:leader.accessToken})).data.grade.totalScore),9.5);

  const inactiveCode=`REG${context.runId}IN`,inactiveEmail=`reg${context.runId}inactive@example.test`,password=process.env.DEMO_STUDENT_PASSWORD;
  await requestAs(recorder,"/users",{token:admin.accessToken,method:"POST",expected:[201],body:{fullName:"Sinh viên inactive",email:inactiveEmail,role:"STUDENT",userCode:inactiveCode,password,confirmPassword:password}});
  const inactive=await loginAs(recorder,inactiveEmail,password,"STUDENT");
  await requestAs(recorder,`/student/course-class-enrollment/${classInactive.id}`,{token:inactive.accessToken,method:"POST",expected:[201]});
  const inactiveRequirement=(await requestAs(recorder,"/lecturer/submission-requirements",{token:lecturer.accessToken,method:"POST",expected:[201],body:{...requirementBody(classInactive.id,`${context.prefix}_INACTIVE`),requiredItems:[items[0]]}})).data;
  await requestAs(recorder,`/student/course-class-enrollment/${classInactive.id}`,{token:inactive.accessToken,method:"DELETE"});
  const unreadBefore=(await requestAs(recorder,"/notifications/unread-count",{token:inactive.accessToken})).data.count;
  await requestAs(recorder,`/lecturer/submission-requirements/${inactiveRequirement.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"OPEN"}});
  assert.ok(!(await requestAs(recorder,"/student/submission-requirements",{token:inactive.accessToken})).data.some(x=>x.id===inactiveRequirement.id));
  await requestAs(recorder,`/student/submission-requirements/${inactiveRequirement.id}`,{token:inactive.accessToken,expected:[404]});
  const inactiveForm=new FormData();inactiveForm.append("responses","[]");
  await requestAs(recorder,`/student/submission-requirements/${inactiveRequirement.id}/submissions`,{token:inactive.accessToken,method:"POST",expected:[404],body:inactiveForm});
  assert.equal((await requestAs(recorder,"/notifications/unread-count",{token:inactive.accessToken})).data.count,unreadBefore);
 }finally{cleanup=await cleanupRegressionData(context);printSummary("progress-grading-boundaries",recorder,cleanup);}
});
