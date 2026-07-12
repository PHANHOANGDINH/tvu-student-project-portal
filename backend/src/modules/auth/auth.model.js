<<<<<<< HEAD
﻿import { sql, poolPromise } from '../../config/db.js';
=======
// src/modules/auth/auth.model.js
import { sql, poolPromise } from "../../config/db.js";
>>>>>>> 8b95a6f4b70675a1d81fa53807382cd291eaf0f1

export async function findUserByEmail(email) {
    const pool = await poolPromise;

    const result = await pool.request().input("Email", sql.NVarChar(150), email)
        .query(`
      SELECT TOP 1
    Id,
    FullName,
    Email,
    PasswordHash,
    Role,
    IsLocked,
    CreatedAt
FROM Users
WHERE Email = @Email
  AND DeletedAt IS NULL
    `);

    return result.recordset[0] || null;
}

export async function findUserById(id) {
    const pool = await poolPromise;

    const result = await pool.request().input("Id", sql.Int, id).query(`
      SELECT TOP 1
        Id,
        FullName,
        Email,
        UserCode,
        Phone,
        Department,
        ClassName,
        Role,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM Users
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

<<<<<<< HEAD
  return result.recordset[0] || null;
}

export async function findUserWithPasswordById(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
      SELECT TOP 1
        Id,
        FullName,
        Email,
        PasswordHash,
        Role,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM Users
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function updateUserPassword(id, passwordHash) {
  const pool = await poolPromise;

  await pool
    .request()
    .input('Id', sql.Int, id)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE Users
      SET
        PasswordHash = @PasswordHash,
        UpdatedAt = GETDATE()
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);
=======
    return result.recordset[0] || null;
>>>>>>> 8b95a6f4b70675a1d81fa53807382cd291eaf0f1
}
