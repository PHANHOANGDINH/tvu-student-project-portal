import assert from 'node:assert/strict';
import test from 'node:test';
import { createCsv,csvRecords,parseCsv } from './csv.util.js';

test('parse CSV UTF-8 with quoted values',()=>{
  const rows=parseCsv('\uFEFFstudentCode,fullName,email,password\r\nSV01,"Nguyễn, Văn",a@example.test,Password1');
  assert.equal(rows[1][1],'Nguyễn, Văn');
});

test('require exact import headers',()=>{
  assert.throws(()=>csvRecords('email,fullName\na@b.test,A',['studentCode','fullName','email','password']),/Header CSV/);
});

test('escape formula injection when exporting CSV',()=>{
  const csv=createCsv(['studentCode','fullName'],[['=cmd','+SUM(1,1)']]);
  assert.match(csv,/'=cmd/);
  assert.match(csv,/"'\+SUM\(1,1\)"/);
});
