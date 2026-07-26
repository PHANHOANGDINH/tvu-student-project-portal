import assert from "node:assert/strict";
import sql from "mssql";
import "dotenv/config";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import app from "../../src/app.js";
import { poolPromise } from "../../src/config/db.js";

const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
const API_BASE = process.env.REGRESSION_API_BASE_URL || `http://127.0.0.1:${address.port}/api`;

export const createRecorder = () => ({
  total: 0, ok2xx: 0, expected4xx: 0, unexpected4xx: 0, server5xx: 0, failures: [],
});

export async function requestAs(recorder, path, { token, method = "GET", body, expected = [200] } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (error) {
    recorder.failures.push({ path, network: error.message });
    throw error;
  }
  const payload = await response.json().catch(() => null);
  recorder.total++;
  if (response.status >= 500) recorder.server5xx++;
  else if (response.ok) recorder.ok2xx++;
  else if (expected.includes(response.status)) recorder.expected4xx++;
  else recorder.unexpected4xx++;
  if (!expected.includes(response.status)) recorder.failures.push({ path, status: response.status, expected });
  assert.ok(response.status < 500, `${path} returned HTTP ${response.status}`);
  assert.ok(expected.includes(response.status), `${path}: expected ${expected.join("/")}, got ${response.status}: ${payload?.message || "no message"}`);
  return { status: response.status, payload, data: payload?.data };
}

export async function loginAs(recorder, email, password, expectedRole) {
  const result = await requestAs(recorder, "/auth/login", {
    method: "POST", body: { email, password }, expected: [200],
  });
  assert.equal(result.data.user.role, expectedRole);
  assert.ok(result.data.accessToken);
  return result.data;
}

export function createRegressionContext() {
  const runId = `${Date.now().toString().slice(-8)}${process.pid}`;
  return { runId, prefix: `REG_${runId}`, resources: [], tempDirectories: [] };
}

export async function createCsvFile(context,name,headers,rows){const directory=await mkdtemp(join(tmpdir(),`tvu-reg-${context.runId}-`));context.tempDirectories.push(directory);const escape=value=>`"${String(value??"").replaceAll('"','""')}"`;const content=[headers,...rows].map(row=>row.map(escape).join(",")).join("\r\n"),path=join(directory,name);await writeFile(path,`\uFEFF${content}`,"utf8");return{path,content};}
export async function createTestFile(context,name,content){const directory=await mkdtemp(join(tmpdir(),`tvu-reg-${context.runId}-`));context.tempDirectories.push(directory);const path=join(directory,name);await writeFile(path,content);return{path,content};}
export async function csvForm(path,fields={}){const form=new FormData();form.append("file",new Blob([await readFile(path)],{type:"text/csv"}),path.split(/[\\\\/]/).pop());Object.entries(fields).forEach(([key,value])=>form.append(key,String(value)));return form;}

export async function lookupDemoUsers() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT Id id,UserCode userCode,Email email,Role role FROM Users
    WHERE UserCode IN('GV001','GV002','SV001','SV002','SV003') AND DeletedAt IS NULL
  `);
  return new Map(result.recordset.map(user => [user.userCode, user]));
}

export async function cleanupRegressionData(context) {
  const pool = await poolPromise;
  await pool.request()
    .input("Prefix", sql.NVarChar(100), `${context.prefix}%`)
    .input("UserPrefix", sql.NVarChar(100), `REG${context.runId}%`)
    .query(`
      SET XACT_ABORT ON; BEGIN TRANSACTION;\n      DELETE FROM Notifications WHERE UserId IN(SELECT Id FROM Users WHERE UserCode LIKE @UserPrefix) OR RelatedEntityId IN(SELECT Id FROM StudentGroups WHERE Name LIKE @Prefix);\n      DELETE FROM GroupMembers WHERE GroupId IN(SELECT Id FROM StudentGroups WHERE Name LIKE @Prefix);\n      DELETE FROM StudentGroups WHERE Name LIKE @Prefix;
      DELETE FROM CourseClassEnrollments WHERE CourseClassId IN(
        SELECT c.Id FROM CourseClasses c
        WHERE c.Code LIKE @Prefix OR c.CourseClassCode LIKE @Prefix
           OR c.SubjectId IN(SELECT Id FROM Subjects WHERE Code LIKE @Prefix)
           OR c.SemesterId IN(SELECT Id FROM Semesters WHERE Code LIKE @Prefix)
      ) OR StudentId IN(SELECT Id FROM Users WHERE UserCode LIKE @UserPrefix);
      DELETE FROM CourseClasses WHERE Code LIKE @Prefix OR CourseClassCode LIKE @Prefix
        OR SubjectId IN(SELECT Id FROM Subjects WHERE Code LIKE @Prefix)
        OR SemesterId IN(SELECT Id FROM Semesters WHERE Code LIKE @Prefix);
      DELETE FROM Subjects WHERE Code LIKE @Prefix;
      DELETE FROM Semesters WHERE Code LIKE @Prefix;
      DELETE FROM AcademicYears WHERE Name LIKE @Prefix;
      DELETE FROM Users WHERE UserCode LIKE @UserPrefix;
      COMMIT TRANSACTION;
    `);
  const row = (await pool.request()
    .input("Prefix", sql.NVarChar(100), `${context.prefix}%`)
    .input("UserPrefix", sql.NVarChar(100), `REG${context.runId}%`)
    .query(`
      SELECT
       (SELECT COUNT(*) FROM Users WHERE UserCode LIKE @UserPrefix) users,
       (SELECT COUNT(*) FROM AcademicYears WHERE Name LIKE @Prefix) years,
       (SELECT COUNT(*) FROM Semesters WHERE Code LIKE @Prefix) semesters,
       (SELECT COUNT(*) FROM Subjects WHERE Code LIKE @Prefix) subjects,
       (SELECT COUNT(*) FROM CourseClasses WHERE Code LIKE @Prefix OR CourseClassCode LIKE @Prefix
          OR SubjectId IN(SELECT Id FROM Subjects WHERE Code LIKE @Prefix)
          OR SemesterId IN(SELECT Id FROM Semesters WHERE Code LIKE @Prefix)) classes
    `)).recordset[0];
  assert.deepEqual(Object.values(row).map(Number), [0, 0, 0, 0, 0]);
  for(const directory of context.tempDirectories)await rm(directory,{recursive:true,force:true});
  await pool.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return { leftovers: 0 };
}

export function printSummary(name, recorder, cleanup) {
  console.log(JSON.stringify({
    regression: name,
    requests: {
      total: recorder.total, "2xx": recorder.ok2xx, expected4xx: recorder.expected4xx,
      unexpected4xx: recorder.unexpected4xx, "5xx": recorder.server5xx,
      endpointFailures: recorder.failures,
    },
    cleanup,
  }));
}
