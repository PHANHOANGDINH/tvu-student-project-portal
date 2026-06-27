// src/modules/auth/auth.model.js
import { sql, poolPromise } from '../../config/db.js';

export async function findUserByEmail(email) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT TOP 1
        Id,
        FullName,
        Email,
        PasswordHash,
        Role,
        IsActive,
        CreatedAt
      FROM Users
      WHERE Email = @Email
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function findUserById(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
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

  return result.recordset[0] || null;
}