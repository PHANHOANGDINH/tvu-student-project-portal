import test from'node:test';import assert from'node:assert/strict';import{buildCourseClassCode,buildSemesterCode,getNextSectionNumber}from'./courseClassCode.js'
test('build semester 2 academic year 2025-2026',()=>assert.equal(buildSemesterCode({semesterName:'Học kỳ 2',academicYearName:'2025-2026'}),'22526'))
test('build semester 1 and summer codes',()=>{assert.equal(buildSemesterCode({semesterName:'Học kỳ 1',academicYearName:'2025-2026'}),'12526');assert.equal(buildSemesterCode({semesterName:'Học kỳ hè',academicYearName:'2025-2026'}),'32526')})
test('next section number',()=>{assert.equal(getNextSectionNumber(1),2);assert.equal(getNextSectionNumber(null),1)})
test('build course class sections',()=>{assert.equal(buildCourseClassCode({semesterCode:'22526',subjectCode:'420000',sectionNumber:1}),'22526-420000-01');assert.equal(buildCourseClassCode({semesterCode:'22526',subjectCode:'420000',sectionNumber:2}),'22526-420000-02')})
