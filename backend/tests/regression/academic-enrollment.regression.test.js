import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanupRegressionData, createRecorder, createRegressionContext, loginAs,
  lookupDemoUsers, printSummary, requestAs,
} from "./helpers.js";

test("academic and self-enrollment boundaries", { timeout: 45_000 }, async () => {
  const recorder = createRecorder();
  const context = createRegressionContext();
  let cleanup;
  try {
    const admin = await loginAs(recorder, "admin.demo@tvu.edu.vn", process.env.DEMO_ADMIN_PASSWORD, "ADMIN");
    const gv1 = await loginAs(recorder, "thiennhd@tvu.edu.vn", process.env.DEMO_LECTURER_PASSWORD, "LECTURER");
    const gv2 = await loginAs(recorder, "annb@tvu.edu.vn", process.env.DEMO_LECTURER_PASSWORD, "LECTURER");
    const student = await loginAs(recorder, "sv003@tvu.edu.vn", process.env.DEMO_STUDENT_PASSWORD, "STUDENT");
    const users = await lookupDemoUsers();
    const now = Date.now(), iso = offset => new Date(now + offset).toISOString();
    const year = (await requestAs(recorder, "/academic-years", {
      token: admin.accessToken, method: "POST", expected: [201],
      body: { name: `${context.prefix}_YEAR`, startDate: iso(-86_400_000), endDate: iso(31_536_000_000) },
    })).data;
    const semester = (await requestAs(recorder, "/semesters", {
      token: admin.accessToken, method: "POST", expected: [201],
      body: { academicYearId: year.id, name: `${context.prefix}_SEM`, code: `${context.prefix}_SEM`,
        startDate: iso(-86_400_000), endDate: iso(31_536_000_000) },
    })).data;
    const subject = (await requestAs(recorder, "/subjects", {
      token: admin.accessToken, method: "POST", expected: [201],
      body: { code: `${context.prefix}_SUB`, name: `${context.prefix}_SUBJECT`, credits: 3 },
    })).data;
    async function createClass(openAt, closeAt, capacity = 10) {
      return (await requestAs(recorder, "/course-classes", {
        token: admin.accessToken, method: "POST", expected: [201],
        body: { subjectId: subject.id, semesterId: semester.id, lecturerId: users.get("GV001").id,
          maxStudents: capacity, status: "ACTIVE", allowSelfEnrollment: true,
          enrollmentOpenAt: openAt, enrollmentCloseAt: closeAt },
      })).data;
    }
    const before = await createClass(iso(86_400_000), iso(172_800_000));
    const during = await createClass(iso(-86_400_000), iso(86_400_000));
    const after = await createClass(iso(-172_800_000), iso(-86_400_000));
    const full = await createClass(iso(-86_400_000), iso(86_400_000), 1);
    for (const item of [before, during, after, full]) assert.ok(item.code || item.courseClassCode);

    await requestAs(recorder, `/student/course-class-enrollment/${before.id}`, {
      token: student.accessToken, method: "POST", expected: [403],
    });
    await requestAs(recorder, `/student/course-class-enrollment/${during.id}`, {
      token: student.accessToken, method: "POST", expected: [201],
    });
    await requestAs(recorder, `/student/course-class-enrollment/${during.id}`, {
      token: student.accessToken, method: "POST", expected: [409],
    });
    await requestAs(recorder, `/student/course-class-enrollment/${after.id}`, {
      token: student.accessToken, method: "POST", expected: [403],
    });
    await requestAs(recorder, `/course-classes/${full.id}/students/bulk`, {
      token: admin.accessToken, method: "POST", body: { studentIds: [users.get("SV001").id] },
    });
    await requestAs(recorder, `/student/course-class-enrollment/${full.id}`, {
      token: student.accessToken, method: "POST", expected: [409],
    });
    await requestAs(recorder, `/student/course-class-enrollment/${during.id}`, {
      token: student.accessToken, method: "DELETE",
    });
    await requestAs(recorder, `/lecturer/course-classes/${during.id}`, {
      token: gv2.accessToken, expected: [404],
    });
    await requestAs(recorder, `/lecturer/course-classes/${during.id}`, { token: gv1.accessToken });
    await requestAs(recorder, `/student/course-classes/${during.id}`, {
      token: student.accessToken, expected: [404],
    });
    const list = await requestAs(recorder, "/lecturer/course-classes?pageSize=100", { token: gv1.accessToken });
    assert.ok([before.id, during.id, after.id, full.id].every(id => list.data.items.some(item => item.id === id)));
  } finally {
    cleanup = await cleanupRegressionData(context);
    printSummary("academic-enrollment", recorder, cleanup);
  }
});
