import test from "node:test";
import assert from "node:assert/strict";
import sql from "mssql";
import { readFile } from "node:fs/promises";
import { poolPromise } from "../../src/config/db.js";
import {
  cleanupRegressionData, createRecorder, createRegressionContext, createTestFile,
  loginAs, lookupDemoUsers, printSummary, requestAs, requestDownload,
} from "./helpers.js";

test("weekly progress submission, revision, review and grading workflows",{timeout:120_000},async()=>{
 const recorder=createRecorder(),context=createRegressionContext();let cleanup;
 try{
  const lecturer=await loginAs(recorder,"thiennhd@tvu.edu.vn",process.env.DEMO_LECTURER_PASSWORD,"LECTURER");
  const otherLecturer=await loginAs(recorder,"annb@tvu.edu.vn",process.env.DEMO_LECTURER_PASSWORD,"LECTURER");
  const admin=await loginAs(recorder,"admin.demo@tvu.edu.vn",process.env.DEMO_ADMIN_PASSWORD,"ADMIN");
  const leader=await loginAs(recorder,"sv001@tvu.edu.vn",process.env.DEMO_STUDENT_PASSWORD,"STUDENT");
  const member=await loginAs(recorder,"sv002@tvu.edu.vn",process.env.DEMO_STUDENT_PASSWORD,"STUDENT");
  const outside=await loginAs(recorder,"sv003@tvu.edu.vn",process.env.DEMO_STUDENT_PASSWORD,"STUDENT");
  const users=await lookupDemoUsers(),pool=await poolPromise,now=Date.now(),iso=offset=>new Date(now+offset).toISOString();
  const year=(await requestAs(recorder,"/academic-years",{token:admin.accessToken,method:"POST",expected:[201],body:{name:`${context.prefix}_YEAR`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const semester=(await requestAs(recorder,"/semesters",{token:admin.accessToken,method:"POST",expected:[201],body:{academicYearId:year.id,name:`${context.prefix}_SEM`,code:`${context.prefix}_SEM`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const subject=(await requestAs(recorder,"/subjects",{token:admin.accessToken,method:"POST",expected:[201],body:{code:`${context.prefix}_SUB`,name:`${context.prefix}_SUBJECT`,credits:3}})).data;
  async function course(lecturerId){return(await requestAs(recorder,"/course-classes",{token:admin.accessToken,method:"POST",expected:[201],body:{subjectId:subject.id,semesterId:semester.id,lecturerId,maxStudents:20,status:"ACTIVE",allowSelfEnrollment:true,enrollmentOpenAt:iso(-86400000),enrollmentCloseAt:iso(86400000)}})).data}
  const classA=await course(users.get("GV001").id),classB=await course(users.get("GV002").id);
  await requestAs(recorder,`/course-classes/${classA.id}/students/bulk`,{token:admin.accessToken,method:"POST",body:{studentIds:[users.get("SV001").id,users.get("SV002").id]}});
  const group=(await requestAs(recorder,`/course-classes/${classA.id}/groups`,{token:leader.accessToken,method:"POST",expected:[201],body:{name:`${context.prefix}_GROUP`,maxMembers:5}})).data;
  await requestAs(recorder,`/groups/${group.id}/members`,{token:leader.accessToken,method:"POST",body:{studentId:users.get("SV002").id}});

  const types=["TEXT_SUMMARY","COMPLETED_TASKS","BLOCKERS","NEXT_PLAN","GITHUB_REPOSITORY","GITHUB_PULL_REQUEST","JIRA_BOARD","FIGMA","DEMO_VIDEO","REPORT_FILE","OTHER_URL"];
  const requiredItems=types.map((type,index)=>({type,name:`Mục ${index+1} ${type}`,description:`Mô tả ${type}`,isRequired:true,displayOrder:index+1,maxFiles:type==="REPORT_FILE"?1:null}));
  const body={classId:classA.id,title:`${context.prefix}_WEEKLY`,description:"Báo cáo tiến độ tuần",instructions:"Điền đủ nội dung",startAt:iso(-3600000),deadline:iso(86400000),allowLate:false,allowResubmission:true,maxAttempts:3,maxFileSizeMb:2,requirementType:"WEEKLY_PROGRESS",weekNumber:7,requiredItems};
  for(const invalid of[
   {...body,title:"",weekNumber:0},
   {...body,title:`${context.prefix}_DUP`,requiredItems:[requiredItems[0],requiredItems[0]]},
   {...body,title:`${context.prefix}_TYPE`,requiredItems:[{type:"UNKNOWN"}]},
   {...body,title:`${context.prefix}_TIME`,deadline:body.startAt},
  ])await requestAs(recorder,"/lecturer/submission-requirements",{token:lecturer.accessToken,method:"POST",expected:[400],body:invalid});
  await requestAs(recorder,"/lecturer/submission-requirements",{token:otherLecturer.accessToken,method:"POST",expected:[403],body});
  await requestAs(recorder,"/lecturer/submission-requirements",{token:lecturer.accessToken,method:"POST",expected:[403],body:{...body,classId:classB.id}});
  await requestAs(recorder,"/lecturer/submission-requirements",{token:leader.accessToken,method:"POST",expected:[403],body});
  const requirement=(await requestAs(recorder,"/lecturer/submission-requirements",{token:lecturer.accessToken,method:"POST",expected:[201],body})).data;
  assert.equal(requirement.status,"DRAFT");assert.equal(requirement.weekNumber,7);assert.deepEqual(requirement.requiredItems.map(x=>x.type),types);
  const updated=(await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}`,{token:lecturer.accessToken,method:"PUT",body:{...body,title:`${context.prefix}_WEEKLY_UPDATED`,instructions:"Nội dung đã cập nhật"}})).data;
  assert.equal(updated.instructions,"Nội dung đã cập nhật");
  await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}`,{token:otherLecturer.accessToken,expected:[403]});
  assert.ok(!(await requestAs(recorder,"/student/submission-requirements",{token:leader.accessToken})).data.some(x=>x.id===requirement.id));
  await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"OPEN"}});
  const studentRequirement=(await requestAs(recorder,`/student/submission-requirements/${requirement.id}`,{token:leader.accessToken})).data;
  assert.deepEqual(studentRequirement.requiredItems.map(x=>x.type),types);
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}`,{token:outside.accessToken,expected:[404]});

  const itemByType=new Map(studentRequirement.requiredItems.map(x=>[x.type,x]));
  const report=await createTestFile(context,"Báo cáo tiến độ.pdf",Buffer.from("%PDF-1.4\nregression report\n%%EOF"));
  function responses(suffix="1"){return types.filter(type=>type!=="REPORT_FILE").map(type=>({itemId:itemByType.get(type).id,value:["GITHUB_REPOSITORY","GITHUB_PULL_REQUEST","JIRA_BOARD","FIGMA","DEMO_VIDEO","OTHER_URL"].includes(type)?`https://example.test/${type.toLowerCase()}/${suffix}`:`Nội dung ${type} lần ${suffix}`}))}
  async function form(values=responses(),includeFile=true,file=report,mime="application/pdf",name="Báo cáo tiến độ.pdf"){
   const data=new FormData();data.append("responses",JSON.stringify(values));
   if(includeFile)data.append(`item_${itemByType.get("REPORT_FILE").id}`,new Blob([await readFile(file.path)],{type:mime}),name);
   return data;
  }
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:member.accessToken,method:"POST",expected:[403],body:await form()});
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[400],body:await form(responses().slice(1))});
  const badUrl=responses();badUrl.find(x=>x.itemId===itemByType.get("FIGMA").id).value="javascript:bad";
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[400],body:await form(badUrl)});
  const duplicate=[...responses(),responses()[0]];
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[400],body:await form(duplicate)});
  const invalidFile=await createTestFile(context,"invalid.txt","not a report"),fakePdfFile=await createTestFile(context,"fake.pdf","plain text"),truncatedPdfFile=await createTestFile(context,"truncated.pdf","%PDF-1.4\nmissing eof"),emptyFile=await createTestFile(context,"empty.pdf",Buffer.alloc(0)),largeFile=await createTestFile(context,"large.pdf",Buffer.concat([Buffer.from("%PDF-1.4\n"),Buffer.alloc(2*1024*1024,65),Buffer.from("\n%%EOF")]));
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[400],body:await form(responses(),true,invalidFile,"text/plain","invalid.txt")});
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[400],body:await form(responses(),true,fakePdfFile,"application/pdf","fake.pdf")});
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[400],body:await form(responses(),true,truncatedPdfFile,"application/pdf","truncated.pdf")});
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[400],body:await form(responses(),true,emptyFile,"application/pdf","empty.pdf")});
  await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[413],body:await form(responses(),true,largeFile,"application/pdf","large.pdf")});
  await requestDownload(recorder,"/student/submission-files/2147483000/download",{token:leader.accessToken,expected:[404]});
  const submitted=(await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[201],body:await form()})).data;
  assert.equal(submitted.latestAttemptNumber,1);assert.equal(submitted.attempts[0].responses.length,11);
  const attempt1=submitted.attempts[0],file1=attempt1.responses.find(x=>x.type==="REPORT_FILE");
  assert.equal(attempt1.status,"SUBMITTED");assert.equal(file1.originalName,"Báo cáo tiến độ.pdf");
  const reportDownload=await requestDownload(recorder,`/student/submission-files/${file1.fileId}/download`,{token:member.accessToken});assert.match(reportDownload.headers.get("content-type")||"",/pdf/);assert.equal(Number(reportDownload.headers.get("content-length")),report.content.length);assert.ok(!/[\r\n]/.test(reportDownload.headers.get("content-disposition")||""))
  await requestDownload(recorder,`/student/submission-files/${file1.fileId}/download`,{token:outside.accessToken,expected:[403]});
  await requestDownload(recorder,`/lecturer/submission-files/${file1.fileId}/download`,{token:otherLecturer.accessToken,expected:[403]});
  await requestAs(recorder,`/lecturer/submissions/${submitted.id}`,{token:otherLecturer.accessToken,expected:[403]});
  assert.equal((await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}/submissions`,{token:lecturer.accessToken})).data.length,1);

  await requestAs(recorder,`/lecturer/submissions/${submitted.id}/status`,{token:lecturer.accessToken,method:"PATCH",expected:[400],body:{status:"REQUIRES_REVISION",comment:""}});
  const revision=(await requestAs(recorder,`/lecturer/submissions/${submitted.id}/feedback`,{token:lecturer.accessToken,method:"POST",body:{comment:"Cần bổ sung minh chứng",revisionRequired:true,revisionReason:"Bổ sung liên kết và báo cáo"}})).data;
  assert.equal(revision.status,"REQUIRES_REVISION");
  const report2=await createTestFile(context,"Báo cáo tiến độ lần 2.pdf",Buffer.from("%PDF-1.4\nsecond immutable report\n%%EOF"));
  const resubmitted=(await requestAs(recorder,`/student/submission-requirements/${requirement.id}/submissions`,{token:leader.accessToken,method:"POST",expected:[201],body:await form(responses("2"),true,report2,"application/pdf","Báo cáo tiến độ lần 2.pdf")})).data;
  assert.equal(resubmitted.latestAttemptNumber,2);assert.deepEqual(resubmitted.attempts.map(x=>x.attemptNumber),[2,1]);
  assert.equal(resubmitted.attempts[1].responses.find(x=>x.type==="TEXT_SUMMARY").textValue,"Nội dung TEXT_SUMMARY lần 1");
  assert.equal(resubmitted.attempts[0].responses.find(x=>x.type==="TEXT_SUMMARY").textValue,"Nội dung TEXT_SUMMARY lần 2");
  await requestAs(recorder,`/lecturer/submissions/${submitted.id}/status`,{token:lecturer.accessToken,method:"PATCH",body:{status:"COMPLETED",comment:"Đạt yêu cầu"}});

  const c1=(await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}/criteria`,{token:lecturer.accessToken,method:"POST",expected:[201],body:{name:"Nội dung",description:"Độ đầy đủ",maxScore:6,displayOrder:1}})).data;
  const c2=(await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}/criteria`,{token:lecturer.accessToken,method:"POST",expected:[201],body:{name:"Minh chứng",maxScore:4,displayOrder:2}})).data;
  await requestAs(recorder,`/lecturer/submission-requirements/${requirement.id}/criteria`,{token:lecturer.accessToken,method:"POST",expected:[400],body:{name:"Vượt tổng",maxScore:1}});
  await requestAs(recorder,`/lecturer/evaluation-criteria/${c2.id}`,{token:otherLecturer.accessToken,method:"PUT",expected:[403],body:{name:"Sai quyền",maxScore:4}});
  await requestAs(recorder,`/lecturer/submissions/${submitted.id}/grade`,{token:lecturer.accessToken,method:"POST",expected:[400],body:{scores:[{criterionId:c1.id,score:7},{criterionId:c2.id,score:3}],isPublished:false}});
  const draft=(await requestAs(recorder,`/lecturer/submissions/${submitted.id}/grade`,{token:lecturer.accessToken,method:"POST",body:{scores:[{criterionId:c1.id,score:5.5,comment:"Tốt"},{criterionId:c2.id,score:3.5}],isPublished:false}})).data;
  assert.equal(Number(draft.grade.totalScore),9);assert.equal(draft.grade.isPublished,false);
  assert.equal((await requestAs(recorder,`/student/submissions/${submitted.id}/result`,{token:leader.accessToken})).data.grade,null);
  await requestAs(recorder,`/lecturer/evaluation-criteria/${c1.id}`,{token:lecturer.accessToken,method:"DELETE",expected:[409]});
  const published=(await requestAs(recorder,`/lecturer/submissions/${submitted.id}/grade`,{token:lecturer.accessToken,method:"PUT",body:{scores:[{criterionId:c1.id,score:6},{criterionId:c2.id,score:3.5}],isPublished:true}})).data;
  assert.equal(published.status,"GRADED");assert.equal(Number(published.grade.totalScore),9.5);assert.equal(published.grade.isPublished,true);
  await requestAs(recorder,`/lecturer/submissions/${submitted.id}/grade`,{token:lecturer.accessToken,method:"PUT",expected:[409],body:{totalScore:10,isPublished:true}});
  const result=(await requestAs(recorder,`/student/submissions/${submitted.id}/result`,{token:member.accessToken})).data;
  assert.equal(Number(result.grade.totalScore),9.5);assert.equal(result.grade.scores.length,2);
  await requestAs(recorder,`/student/submissions/${submitted.id}/result`,{token:outside.accessToken,expected:[404]});
  const history=(await requestAs(recorder,`/student/submissions/${submitted.id}/review-history`,{token:leader.accessToken})).data;
  assert.ok(history.some(x=>x.eventType==="REVISION_REQUESTED"));assert.ok(history.some(x=>x.eventType==="GRADE_PUBLISHED"));
  const notices=(await requestAs(recorder,"/notifications?pageSize=100",{token:leader.accessToken})).data.items;
  assert.ok(notices.some(x=>x.type==="REVISION_REQUESTED"&&x.relatedEntityId===submitted.id));
  const gradeNotice=notices.find(x=>x.type==="GRADE_PUBLISHED"&&x.relatedEntityId===submitted.id);assert.ok(gradeNotice);
  await requestAs(recorder,`/notifications/${gradeNotice.id}/read`,{token:leader.accessToken,method:"PATCH"});
  const db=(await pool.request().input("Id",sql.Int,submitted.id).query("SELECT LatestAttemptNumber attempts,Status status FROM Submissions WHERE Id=@Id")).recordset[0];
  assert.deepEqual(db,{attempts:2,status:"GRADED"});
 }finally{cleanup=await cleanupRegressionData(context);printSummary("progress-grading",recorder,cleanup);}
});
