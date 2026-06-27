import { getPool, sql } from '../../config/db.js';

export async function findUserByEmail(email) {
  const pool = await getPool();

  const result = await pool.request()
    .input('Email', sql.VarChar(150), email)
    .query(`
      SELECT TOP 1
        UserId,
        FullName,
        Email,
        PasswordHash,
        Role,
        UserCode,
        IsLocked,
        CreatedAt
      FROM Users
      WHERE Email = @Email
    `);

  return result.recordset[0] || null;
}

export async function findUserById(userId) {
  const pool = await getPool();

  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT TOP 1
        UserId,
        FullName,
        Email,
        Role,
        UserCode,
        IsLocked,
        CreatedAt
      FROM Users
      WHERE UserId = @UserId
    `);

  return result.recordset[0] || null;
}

export async function createUser(user) {
  const pool = await getPool();

  const result = await pool.request()
    .input('FullName', sql.NVarChar(100), user.fullName)
    .input('Email', sql.VarChar(150), user.email)
    .input('PasswordHash', sql.VarChar(255), user.passwordHash)
    .input('Role', sql.VarChar(20), user.role)
    .input('UserCode', sql.VarChar(30), user.userCode || null)
    .query(`
      INSERT INTO Users (
        FullName,
        Email,
        PasswordHash,
        Role,
        UserCode
      )
      OUTPUT INSERTED.UserId
      VALUES (
        @FullName,
        @Email,
        @PasswordHash,
        @Role,
        @UserCode
      )
    `);

  return result.recordset[0].UserId;
}