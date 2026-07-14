import { poolPromise, sql } from '../../config/db.js';

const SORT_COLUMNS = Object.freeze({
  fullName: 'u.FullName',
  email: 'u.Email',
  userCode: 'u.UserCode',
  role: 'u.Role',
  status: 'u.IsActive',
  createdAt: 'u.CreatedAt',
});

function mapUser(record) {
  if (!record) return null;

  return {
    id: record.Id,
    fullName: record.FullName,
    email: record.Email,
    userCode: record.UserCode,
    phone: record.Phone,
    department: record.Department,
    className: record.ClassName,
    role: record.Role,
    isActive: record.IsActive,
    createdAt: record.CreatedAt,
    updatedAt: record.UpdatedAt,
  };
}

function addUserFilters(request, filters = {}) {
  const search = filters.search ? `%${filters.search}%` : null;
  const role = filters.role || null;
  const status = filters.status || null;

  request.input('Search', sql.NVarChar(200), search);
  request.input('Role', sql.NVarChar(20), role);
  request.input('Status', sql.NVarChar(20), status);

  return `
    WHERE u.DeletedAt IS NULL
      AND (
        @Search IS NULL
        OR u.FullName LIKE @Search
        OR u.Email LIKE @Search
        OR u.UserCode LIKE @Search
        OR u.Phone LIKE @Search
        OR u.Department LIKE @Search
        OR u.ClassName LIKE @Search
      )
      AND (@Role IS NULL OR u.Role = @Role)
      AND (
        @Status IS NULL
        OR (@Status = 'ACTIVE' AND u.IsActive = 1)
        OR (@Status = 'INACTIVE' AND u.IsActive = 0)
      )
  `;
}

export function getSortExpression(sortBy = 'createdAt', sortOrder = 'desc') {
  const column = SORT_COLUMNS[sortBy] || SORT_COLUMNS.createdAt;
  const direction = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  return `${column} ${direction}`;
}

export async function findUsers(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();
  const whereClause = addUserFilters(request, filters);
  const orderBy = getSortExpression(filters.sortBy, filters.sortOrder);
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const pageSize = Number(filters.pageSize) > 0 ? Number(filters.pageSize) : 10;
  const offset = (page - 1) * pageSize;

  request.input('Offset', sql.Int, offset);
  request.input('PageSize', sql.Int, pageSize);

  const result = await request.query(`
    SELECT
      u.Id,
      u.FullName,
      u.Email,
      u.UserCode,
      u.Phone,
      u.Department,
      u.ClassName,
      u.Role,
      u.IsActive,
      u.CreatedAt,
      u.UpdatedAt
    FROM Users u
    ${whereClause}
    ORDER BY ${orderBy}
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
  `);

  return result.recordset.map(mapUser);
}

export async function countUsers(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();
  const whereClause = addUserFilters(request, filters);

  const result = await request.query(`
    SELECT COUNT(*) AS Total
    FROM Users u
    ${whereClause}
  `);

  return Number(result.recordset[0]?.Total || 0);
}

export async function findUserById(id) {
  const pool = await poolPromise;

  const result = await pool.request()
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

  return mapUser(result.recordset[0]);
}

export async function findUserByEmail(email) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT TOP 1 Id, Email, DeletedAt
      FROM Users
      WHERE Email = @Email
    `);

  return result.recordset[0] || null;
}

export async function findUserByUserCode(userCode) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('UserCode', sql.NVarChar(50), userCode)
    .query(`
      SELECT TOP 1 Id, UserCode, DeletedAt
      FROM Users
      WHERE UserCode = @UserCode
    `);

  return result.recordset[0] || null;
}

export async function countActiveAdmins(excludeUserId = null) {
  const pool = await poolPromise;
  const request = pool.request();

  request.input('ExcludeUserId', sql.Int, excludeUserId);

  const result = await request.query(`
    SELECT COUNT(*) AS Total
    FROM Users
    WHERE Role = 'ADMIN'
      AND IsActive = 1
      AND DeletedAt IS NULL
      AND (@ExcludeUserId IS NULL OR Id <> @ExcludeUserId)
  `);

  return Number(result.recordset[0]?.Total || 0);
}

export async function createUser(data) {
  const pool = await poolPromise;

  const result = await pool.request()
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
        ClassName,
        IsActive
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
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt
      VALUES (
        @FullName,
        @Email,
        @PasswordHash,
        @Role,
        @UserCode,
        @Phone,
        @Department,
        @ClassName,
        1
      )
    `);

  return mapUser(result.recordset[0]);
}

export async function updateUser(id, data) {
  const pool = await poolPromise;

  const result = await pool.request()
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

  return mapUser(result.recordset[0]);
}

export async function updateUserStatus(id, isActive) {
  const pool = await poolPromise;

  const result = await pool.request()
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

  return mapUser(result.recordset[0]);
}

export async function updatePassword(id, passwordHash) {
  const pool = await poolPromise;

  const result = await pool.request()
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

  return mapUser(result.recordset[0]);
}
