// src/modules/admin/admin.users.model.js
import { sql, poolPromise } from '../../config/db.js';

function addUserFilters(request, filters = {}) {
  const search = filters.search ? `%${filters.search.trim()}%` : null;
  const role = filters.role || null;
  const status = filters.status || 'not-deleted';

  request.input('Search', sql.NVarChar(200), search);
  request.input('Role', sql.NVarChar(20), role);
  request.input('Status', sql.NVarChar(20), status);

  return `
    WHERE
      (
        @Search IS NULL
        OR FullName LIKE @Search
        OR Email LIKE @Search
        OR UserCode LIKE @Search
        OR Phone LIKE @Search
      )
      AND
      (
        @Role IS NULL
        OR Role = @Role
      )
      AND
      (
        @Status = 'all'
        OR (@Status = 'not-deleted' AND DeletedAt IS NULL)
        OR (@Status = 'active' AND IsActive = 1 AND DeletedAt IS NULL)
        OR (@Status = 'inactive' AND IsActive = 0 AND DeletedAt IS NULL)
        OR (@Status = 'deleted' AND DeletedAt IS NOT NULL)
      )
  `;
}

export async function getUsers(filters = {}) {
  const pool = await poolPromise;

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;

  const request = pool.request();

  const whereClause = addUserFilters(request, filters);

  request.input('Offset', sql.Int, offset);
  request.input('Limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
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
      UpdatedAt,
      DeletedAt
    FROM Users
    ${whereClause}
    ORDER BY CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
  `);

  return result.recordset;
}

export async function countUsers(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();

  const whereClause = addUserFilters(request, filters);

  const result = await request.query(`
    SELECT COUNT(*) AS Total
    FROM Users
    ${whereClause}
  `);

  return result.recordset[0].Total;
}

export async function getUserStats() {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      COUNT(*) AS TotalUsers,
      SUM(CASE WHEN Role = 'Admin' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalAdmins,
      SUM(CASE WHEN Role = 'Teacher' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalTeachers,
      SUM(CASE WHEN Role = 'Student' AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalStudents,
      SUM(CASE WHEN IsActive = 1 AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalActiveUsers,
      SUM(CASE WHEN IsActive = 0 AND DeletedAt IS NULL THEN 1 ELSE 0 END) AS TotalInactiveUsers,
      SUM(CASE WHEN DeletedAt IS NOT NULL THEN 1 ELSE 0 END) AS TotalDeletedUsers
    FROM Users
  `);

  return result.recordset[0];
}

export async function findUserByIdForAdmin(id) {
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
        UpdatedAt,
        DeletedAt
      FROM Users
      WHERE Id = @Id
    `);

  return result.recordset[0] || null;
}

export async function findUserByEmailForAdmin(email) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT TOP 1
        Id,
        FullName,
        Email,
        DeletedAt
      FROM Users
      WHERE Email = @Email
    `);

  return result.recordset[0] || null;
}

export async function createUser(data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('FullName', sql.NVarChar(100), data.fullName)
    .input('Email', sql.NVarChar(150), data.email)
    .input('PasswordHash', sql.NVarChar(255), data.passwordHash)
    .input('Role', sql.NVarChar(20), data.role)
    .input('UserCode', sql.NVarChar(50), data.userCode || null)
    .input('Phone', sql.NVarChar(20), data.phone || null)
    .input('Department', sql.NVarChar(100), data.department || null)
    .input('ClassName', sql.NVarChar(100), data.className || null)
    .query(`
      INSERT INTO Users (
        FullName,
        Email,
        PasswordHash,
        Role,
        UserCode,
        Phone,
        Department,
        ClassName
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.FullName,
        INSERTED.Email,
        INSERTED.UserCode,
        INSERTED.Phone,
        INSERTED.Department,
        INSERTED.ClassName,
        INSERTED.Role,
        INSERTED.IsActive,
        INSERTED.CreatedAt
      VALUES (
        @FullName,
        @Email,
        @PasswordHash,
        @Role,
        @UserCode,
        @Phone,
        @Department,
        @ClassName
      )
    `);

  return result.recordset[0];
}

export async function updateUser(id, data) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('FullName', sql.NVarChar(100), data.fullName)
    .input('Email', sql.NVarChar(150), data.email)
    .input('Role', sql.NVarChar(20), data.role)
    .input('UserCode', sql.NVarChar(50), data.userCode || null)
    .input('Phone', sql.NVarChar(20), data.phone || null)
    .input('Department', sql.NVarChar(100), data.department || null)
    .input('ClassName', sql.NVarChar(100), data.className || null)
    .query(`
      UPDATE Users
      SET
        FullName = @FullName,
        Email = @Email,
        Role = @Role,
        UserCode = @UserCode,
        Phone = @Phone,
        Department = @Department,
        ClassName = @ClassName,
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.FullName,
        INSERTED.Email,
        INSERTED.UserCode,
        INSERTED.Phone,
        INSERTED.Department,
        INSERTED.ClassName,
        INSERTED.Role,
        INSERTED.IsActive,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function setUserActive(id, isActive) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('IsActive', sql.Bit, isActive)
    .query(`
      UPDATE Users
      SET
        IsActive = @IsActive,
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.FullName,
        INSERTED.Email,
        INSERTED.Role,
        INSERTED.IsActive,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function resetUserPassword(id, passwordHash) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE Users
      SET
        PasswordHash = @PasswordHash,
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.FullName,
        INSERTED.Email,
        INSERTED.Role,
        INSERTED.UpdatedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}

export async function softDeleteUser(id) {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`
      UPDATE Users
      SET
        IsActive = 0,
        DeletedAt = SYSDATETIME(),
        UpdatedAt = SYSDATETIME()
      OUTPUT
        INSERTED.Id,
        INSERTED.FullName,
        INSERTED.Email,
        INSERTED.Role,
        INSERTED.IsActive,
        INSERTED.DeletedAt
      WHERE Id = @Id
        AND DeletedAt IS NULL
    `);

  return result.recordset[0] || null;
}