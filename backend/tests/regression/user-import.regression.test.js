import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanupRegressionData, createCsvFile, createRecorder, createRegressionContext,
  csvForm, loginAs, lookupDemoUsers, printSummary, requestAs,
} from "./helpers.js";

test("lecturer and course-student CSV preview, confirm, validation and atomicity", {timeout:45_000},async()=>{
 const recorder=createRecorder(),context=createRegressionContext();let cleanup;
 try{
  const admin=await loginAs(recorder,"admin.demo@tvu.edu.vn",process.env.DEMO_ADMIN_PASSWORD,"ADMIN"),users=await lookupDemoUsers(),code=`REG${context.runId}`;
  const lecturerCsv=await createCsvFile(context,"lecturers.csv",["lecturerCode","fullName","email","password"],[
   [`${code}GV1`,"Giảng viên Nguyễn Ánh",`${code.toLowerCase()}gv1@example.test`,"Regression123"],
   [`${code}GV2`,"Giảng viên Trần Đức",`${code.toLowerCase()}gv2@example.test`,"Regression123"]]);
  const preview=await requestAs(recorder,"/admin/lecturers/import-preview",{token:admin.accessToken,method:"POST",body:await csvForm(lecturerCsv.path)});
  assert.equal(preview.data.totalRows,2);assert.equal(preview.data.validCount,2);assert.equal(preview.data.invalidCount,0);
  const confirmed=await requestAs(recorder,"/admin/lecturers/import-confirm",{token:admin.accessToken,method:"POST",expected:[201],body:{previewId:preview.data.previewId,mode:"atomic"}});
  assert.equal(confirmed.data.createdCount,2);assert.ok(confirmed.data.lecturers.every(x=>!Object.hasOwn(x,"passwordHash")&&!Object.hasOwn(x,"PasswordHash")));const imported=await requestAs(recorder,`/users?role=LECTURER&search=${code}&pageSize=100`,{token:admin.accessToken});assert.equal(imported.data.items.filter(x=>x.userCode.startsWith(code)&&x.role==="LECTURER").length,2);
  const duplicate=await requestAs(recorder,"/admin/lecturers/import-preview",{token:admin.accessToken,method:"POST",body:await csvForm(lecturerCsv.path)});
  assert.equal(duplicate.data.invalidCount,2);
  const invalidCsv=await createCsvFile(context,"invalid.csv",["lecturerCode","fullName","email","password"],[
   [`${code}BAD1`,"","bad-email","short"],[`${code}BAD1`,"Tên hợp lệ",`${code.toLowerCase()}dup@example.test`,"Regression123"]]);
  const invalid=await requestAs(recorder,"/admin/lecturers/import-preview",{token:admin.accessToken,method:"POST",body:await csvForm(invalidCsv.path)});
  assert.equal(invalid.data.invalidCount,2);
  await requestAs(recorder,"/admin/lecturers/import-confirm",{token:admin.accessToken,method:"POST",expected:[409],body:{previewId:invalid.data.previewId,mode:"atomic"}});

  const now=Date.now(),iso=o=>new Date(now+o).toISOString();
  const year=(await requestAs(recorder,"/academic-years",{token:admin.accessToken,method:"POST",expected:[201],body:{name:`${context.prefix}_YEAR`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const semester=(await requestAs(recorder,"/semesters",{token:admin.accessToken,method:"POST",expected:[201],body:{academicYearId:year.id,name:`${context.prefix}_SEM`,code:`${context.prefix}_SEM`,startDate:iso(-86400000),endDate:iso(31536000000)}})).data;
  const subject=(await requestAs(recorder,"/subjects",{token:admin.accessToken,method:"POST",expected:[201],body:{code:`${context.prefix}_SUB`,name:`${context.prefix}_SUBJECT`,credits:3}})).data;
  const course=(await requestAs(recorder,"/course-classes",{token:admin.accessToken,method:"POST",expected:[201],body:{subjectId:subject.id,semesterId:semester.id,lecturerId:users.get("GV001").id,maxStudents:10,status:"ACTIVE",allowSelfEnrollment:true,enrollmentOpenAt:iso(-86400000),enrollmentCloseAt:iso(86400000)}})).data;
  const studentCsv=await createCsvFile(context,"students.csv",["studentCode","fullName","email","password"],[
   [`${code}SV1`,"Sinh viên Nguyễn Thị Ánh",`${code.toLowerCase()}sv1@example.test`,"Regression123"],
   [`${code}SV2`,"Sinh viên Trần Minh Đức",`${code.toLowerCase()}sv2@example.test`,"Regression123"]]);
  const studentPreview=await requestAs(recorder,"/admin/students/import-preview",{token:admin.accessToken,method:"POST",body:await csvForm(studentCsv.path,{courseClassId:course.id})});
  assert.equal(studentPreview.data.validCount,2);
  const studentConfirm=await requestAs(recorder,"/admin/students/import-confirm",{token:admin.accessToken,method:"POST",expected:[201],body:{previewId:studentPreview.data.previewId,courseClassId:course.id,mode:"atomic"}});
  assert.equal(studentConfirm.data.createdCount,2);
  const list=await requestAs(recorder,`/course-classes/${course.id}/students?pageSize=100`,{token:admin.accessToken});
  assert.equal(list.data.items.filter(x=>x.studentCode.startsWith(code)).length,2);
 }finally{cleanup=await cleanupRegressionData(context);printSummary("user-import",recorder,cleanup);}
});
