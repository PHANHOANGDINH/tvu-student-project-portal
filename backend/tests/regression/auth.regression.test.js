import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanupRegressionData, createRecorder, createRegressionContext, loginAs,
  printSummary, requestAs,
} from "./helpers.js";

test("authentication and locked-account policies", { timeout: 30_000 }, async () => {
  const recorder = createRecorder();
  const context = createRegressionContext();
  let cleanup;
  try {
    const accounts = [
      ["admin.demo@tvu.edu.vn", process.env.DEMO_ADMIN_PASSWORD, "ADMIN"],
      ["thiennhd@tvu.edu.vn", process.env.DEMO_LECTURER_PASSWORD, "LECTURER"],
      ["annb@tvu.edu.vn", process.env.DEMO_LECTURER_PASSWORD, "LECTURER"],
      ["sv001@tvu.edu.vn", process.env.DEMO_STUDENT_PASSWORD, "STUDENT"],
      ["sv002@tvu.edu.vn", process.env.DEMO_STUDENT_PASSWORD, "STUDENT"],
      ["sv003@tvu.edu.vn", process.env.DEMO_STUDENT_PASSWORD, "STUDENT"],
    ];
    const sessions = [];
    for (const account of accounts) sessions.push(await loginAs(recorder, ...account));
    for (const session of sessions) {
      const me = await requestAs(recorder, "/auth/me", { token: session.accessToken });
      assert.equal(me.data.id, session.user.id);
      assert.equal(me.data.role, session.user.role);
    }
    await requestAs(recorder, "/auth/login", {
      method: "POST", body: { email: accounts[0][0], password: "WrongPassword123" }, expected: [401],
    });
    await requestAs(recorder, "/auth/me", { expected: [401] });
    await requestAs(recorder, "/auth/me", { token: "invalid.token.value", expected: [401] });
    await requestAs(recorder, "/users", { token: sessions[3].accessToken, expected: [403] });
    await requestAs(recorder, "/users", { token: sessions[1].accessToken, expected: [403] });

    const userCode = `REG${context.runId}LOCK`;
    const created = await requestAs(recorder, "/users", {
      token: sessions[0].accessToken, method: "POST", expected: [201],
      body: {
        fullName: "Regression Locked Account", email: `${userCode.toLowerCase()}@example.test`,
        role: "STUDENT", userCode, className: "REG", password: "Regression123",
        confirmPassword: "Regression123",
      },
    });
    await requestAs(recorder, `/users/${created.data.id}/status`, {
      token: sessions[0].accessToken, method: "PATCH", body: { isActive: false },
    });
    await requestAs(recorder, "/auth/login", {
      method: "POST", body: { email: `${userCode.toLowerCase()}@example.test`, password: "Regression123" },
      expected: [403],
    });
  } finally {
    cleanup = await cleanupRegressionData(context);
    printSummary("auth", recorder, cleanup);
  }
});
