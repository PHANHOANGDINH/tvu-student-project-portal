import { poolPromise, sql } from '../../config/db.js';

export async function findUserByEmail(email) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT TOP 1
        Id,
        FullName,
        Email,
        PasswordHash,
        Role,
        UserCode,
        IsActive,
        CreatedAt
      FROM Users
      WHERE Email = @Email
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function findUserById(userId) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('Id', sql.Int, userId)
    .query(`
      SELECT TOP 1
        Id,
        FullName,
        Email,
        Role,
        UserCode,
        IsActive,
        CreatedAt
      FROM Users
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function createUser(user) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('FullName', sql.NVarChar(100), user.fullName)
    .input('Email', sql.NVarChar(150), user.email)
    .input('PasswordHash', sql.NVarChar(255), user.passwordHash)
    .input('Role', sql.NVarChar(20), user.role)
    .input('UserCode', sql.NVarChar(50), user.userCode || null)
    .query(`
      INSERT INTO Users (
        FullName,
        Email,
        PasswordHash,
        Role,
        UserCode
      )
      OUTPUT INSERTED.Id
      VALUES (
        @FullName,
        @Email,
        @PasswordHash,
        @Role,
        @UserCode
      )
    `);

  return result.recordset[0].Id;
}
