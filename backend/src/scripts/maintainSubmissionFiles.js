import "dotenv/config";
import { access } from "node:fs/promises";
import { poolPromise } from "../config/db.js";
import { resolveStoredFile } from "../services/fileStorage.service.js";

const confirmArgument = process.argv.find(value => value.startsWith("--confirm-unavailable-demo-file-ids="));
const requestedIds = confirmArgument
  ? confirmArgument.split("=")[1].split(",").map(Number).filter(Number.isInteger)
  : [];
const demoCodes = new Set(["SV001", "SV002", "SV003"]);
const pool = await poolPromise;

try {
  const rows = (await pool.request().query(`
    SELECT f.Id id,f.RelativePath relativePath,f.SizeBytes sizeBytes,
      f.SubmissionAttemptId attemptId,a.SubmissionId submissionId,
      u.UserCode uploadedByCode
    FROM SubmissionFiles f
    JOIN SubmissionAttempts a ON a.Id=f.SubmissionAttemptId
    LEFT JOIN Users u ON u.Id=f.UploadedBy
    ORDER BY f.Id
  `)).recordset;
  const missing = [];
  for (const row of rows) {
    try {
      await access(resolveStoredFile(row.relativePath));
    } catch (error) {
      if (error?.code === "ENOENT") missing.push(row);
      else throw error;
    }
  }

  console.log(JSON.stringify({
    mode: requestedIds.length ? "confirm-explicit-demo-unavailable" : "dry-run",
    records: rows.length,
    missing: missing.length,
    requested: requestedIds.length,
  }));
  if (!requestedIds.length) process.exitCode = 0;
  else {
    const selected = missing.filter(row => requestedIds.includes(row.id));
    if (
      selected.length !== requestedIds.length
      || selected.some(row => !demoCodes.has(row.uploadedByCode) || Number(row.sizeBytes) > 1024)
    ) {
      throw new Error("Refusing confirmation: every requested record must be missing, demo-owned, and at most 1 KB.");
    }
    console.log(JSON.stringify({ confirmedUnavailable: selected.length, removed: 0, retained: missing.length }));
  }
} finally {
  await pool.close();
}
