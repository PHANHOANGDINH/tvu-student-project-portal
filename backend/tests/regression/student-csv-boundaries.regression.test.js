import test from "node:test";
import assert from "node:assert/strict";
import { cleanupRegressionData, createCsvFile, createRecorder, createRegressionContext, createTestFile, csvForm, loginAs, lookupDemoUsers, printSummary, requestAs } from "./helpers.js";

test("student CSV header and size boundaries",{timeout:60_000},async()=>{
 const recorder=createRecorder(),context=createRegressionContext();let cleanup;
 try{
  const admin=await loginAs(recorder,"admin.demo@tvu.edu.vn",process.env.DEMO_ADMIN_PASSWORD,"ADMIN"),users=await lookupDemoUsers(),now=Date.now(),iso=o=>new Date(now+o).toISOString();
  const year=(await requestAs(recorder,"/academic-years",{token:admin.accessToken,method:"POST",expected:[201],body:{name:`${context.prefix}_YEAR`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const semester=(await requestAs(recorder,"/semesters",{token:admin.accessToken,method:"POST",expected:[201],body:{academicYearId:year.id,name:`${context.prefix}_SEM`,code:`${context.prefix}_SEM`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const subject=(await requestAs(recorder,"/subjects",{token:admin.accessToken,method:"POST",expected:[201],body:{code:`${context.prefix}_SUB`,name:`${context.prefix}_SUBJECT`,credits:3}})).data;
  const course=(await requestAs(recorder,"/course-classes",{token:admin.accessToken,method:"POST",expected:[201],body:{subjectId:subject.id,semesterId:semester.id,lecturerId:users.get("GV001").id,maxStudents:10,status:"ACTIVE",allowSelfEnrollment:true,enrollmentOpenAt:iso(-86400000),enrollmentCloseAt:iso(86400000)}})).data;
  const password=process.env.DEMO_STUDENT_PASSWORD,headers=["studentCode","fullName","email","password"],values=[`REG${context.runId}SV`,"Sinh viên Ánh",`reg${context.runId}sv@example.test`,password];
  const matrices=[["missing-studentCode",headers.filter(x=>x!=="studentCode")],["missing-fullName",headers.filter(x=>x!=="fullName")],["missing-email",headers.filter(x=>x!=="email")],["missing-password",headers.filter(x=>x!=="password")],["wrong-studentCode",["student_code","fullName","email","password"]],["wrong-fullName",["studentCode","name","email","password"]]];
  for(const[name,selected]of matrices){const row=selected.map(x=>values[headers.indexOf(x)]),file=await createCsvFile(context,`${name}.csv`,selected,[row]),response=await requestAs(recorder,"/admin/students/import-preview",{token:admin.accessToken,method:"POST",expected:[400],body:await csvForm(file.path,{courseClassId:course.id})});assert.match(response.payload.message,/header|cột|studentCode|fullName|email|password/i);}
  for(const[name,content]of[["empty-header.csv","\uFEFF\r\n"],["header-only.csv",`\uFEFF${headers.join(",")}\r\n`]]){const file=await createTestFile(context,name,content);await requestAs(recorder,"/admin/students/import-preview",{token:admin.accessToken,method:"POST",expected:[400],body:await csvForm(file.path,{courseClassId:course.id})});}
  const small=await createCsvFile(context,"small.csv",headers,[values]);await requestAs(recorder,"/admin/students/import-preview",{token:admin.accessToken,method:"POST",body:await csvForm(small.path,{courseClassId:course.id})});
  const prefix=Buffer.from(`\uFEFF${headers.join(",")}\r\n`),near=await createTestFile(context,"near-2mb.csv",Buffer.concat([prefix,Buffer.alloc(2*1024*1024-prefix.length-1,32)]));await requestAs(recorder,"/admin/students/import-preview",{token:admin.accessToken,method:"POST",expected:[400],body:await csvForm(near.path,{courseClassId:course.id})});
  const over=await createTestFile(context,"over-2mb.csv",Buffer.alloc(2*1024*1024+1,65));await requestAs(recorder,"/admin/students/import-preview",{token:admin.accessToken,method:"POST",expected:[413],body:await csvForm(over.path,{courseClassId:course.id})});
  const search=await requestAs(recorder,`/users?search=REG${context.runId}&pageSize=100`,{token:admin.accessToken});assert.equal(search.data.items.length,0);
 }finally{cleanup=await cleanupRegressionData(context);printSummary("student-csv-boundaries",recorder,cleanup);}
});
