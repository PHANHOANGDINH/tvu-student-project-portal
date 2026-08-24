const REQUIRED_CONFIRMATION = 'LIST_PRODUCTION_ADMINS_2026';
const DENIED_DB_SERVERS = ['localhost', '127.0.0.1', 'msi\\sqlexpress'];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function shouldListProductionAdmins(env = process.env, log = console.log) {
  if (normalize(env.LIST_ADMINS_ON_BOOT) !== 'true') {
    log('LIST_ADMINS_SKIPPED');
    return false;
  }

  const server = normalize(env.DB_SERVER);
  if (
    normalize(env.NODE_ENV) !== 'production'
    || normalize(env.RENDER) !== 'true'
    || DENIED_DB_SERVERS.some((denied) => server.includes(denied))
  ) {
    log('LIST_ADMINS_SKIPPED');
    return false;
  }

  if (env.LIST_ADMINS_CONFIRM !== REQUIRED_CONFIRMATION) {
    throw new Error('LIST_ADMINS_CONFIRM is invalid; refusing production admin diagnosis.');
  }

  return true;
}

function quoteIdentifier(identifier) {
  return `[${String(identifier).replaceAll(']', ']]')}]`;
}

function exactlyOne(items, description) {
  if (items.length !== 1) {
    throw new Error(`Schema discovery expected exactly one ${description}; found ${items.length}.`);
  }
  return items[0];
}

function findColumn(columns, tableObjectId, acceptedNames, description, required = true) {
  const accepted = new Set(acceptedNames.map(normalize));
  const matches = columns.filter(
    (column) => column.objectId === tableObjectId && accepted.has(normalize(column.columnName)),
  );
  if (!required && matches.length === 0) return null;
  return exactlyOne(matches, description);
}

export function discoverUserSchema(metadata, foreignKeys) {
  const userTable = exactlyOne(
    metadata.tables.filter((table) => normalize(table.tableName) === 'users'),
    'Users table',
  );
  const columns = metadata.columns;
  const email = findColumn(columns, userTable.objectId, ['Email'], 'email column');
  const fullName = findColumn(columns, userTable.objectId, ['FullName'], 'full-name column');
  const isActive = findColumn(columns, userTable.objectId, ['IsActive', 'Status'], 'status column');
  const deleted = findColumn(columns, userTable.objectId, ['DeletedAt', 'IsDeleted'], 'soft-delete column', false);
  const directRole = findColumn(columns, userTable.objectId, ['Role'], 'direct role column', false);

  if (directRole) {
    return { userTable, email, fullName, isActive, deleted, directRole, roleJoin: null };
  }

  const roleId = findColumn(columns, userTable.objectId, ['RoleId'], 'role foreign-key column');
  const roleForeignKey = exactlyOne(
    foreignKeys.filter(
      (fk) => fk.parentObjectId === userTable.objectId && fk.parentColumnId === roleId.columnId,
    ),
    'role foreign key',
  );
  const roleTable = exactlyOne(
    metadata.tables.filter((table) => table.objectId === roleForeignKey.referencedObjectId),
    'referenced Roles table',
  );
  const roleValue = findColumn(
    columns,
    roleTable.objectId,
    ['Role', 'Name', 'Code'],
    'role value column',
  );

  return {
    userTable,
    email,
    fullName,
    isActive,
    deleted,
    directRole: null,
    roleJoin: { roleTable, roleValue, roleForeignKey },
  };
}

async function readSchema(pool) {
  const metadataResult = await pool.request().query(`
    SELECT t.object_id AS objectId, s.name AS schemaName, t.name AS tableName
    FROM sys.tables t
    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id;

    SELECT c.object_id AS objectId, c.column_id AS columnId, c.name AS columnName,
           ty.name AS dataType
    FROM sys.columns c
    INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id;
  `);
  const foreignKeyResult = await pool.request().query(`
    SELECT parent_object_id AS parentObjectId, parent_column_id AS parentColumnId,
           referenced_object_id AS referencedObjectId,
           referenced_column_id AS referencedColumnId
    FROM sys.foreign_key_columns;
  `);

  return {
    metadata: {
      tables: metadataResult.recordsets[0],
      columns: metadataResult.recordsets[1],
    },
    foreignKeys: foreignKeyResult.recordset,
  };
}

function booleanSql(column, truthyStatus = 'ACTIVE') {
  const reference = `u.${quoteIdentifier(column.columnName)}`;
  return normalize(column.dataType) === 'bit'
    ? `CASE WHEN ${reference} = 1 THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END`
    : `CASE WHEN UPPER(LTRIM(RTRIM(CONVERT(nvarchar(100), ${reference})))) = '${truthyStatus}' THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END`;
}

async function queryAdmins(pool, schema) {
  const userTable = `${quoteIdentifier(schema.userTable.schemaName)}.${quoteIdentifier(schema.userTable.tableName)}`;
  const roleReference = schema.directRole
    ? `u.${quoteIdentifier(schema.directRole.columnName)}`
    : `r.${quoteIdentifier(schema.roleJoin.roleValue.columnName)}`;
  let resolvedJoin = '';
  if (schema.roleJoin) {
    const parentColumn = schema.roleJoin.parentColumn;
    const referencedColumn = schema.roleJoin.referencedColumn;
    resolvedJoin = `INNER JOIN ${quoteIdentifier(schema.roleJoin.roleTable.schemaName)}.${quoteIdentifier(schema.roleJoin.roleTable.tableName)} r
      ON r.${quoteIdentifier(referencedColumn.columnName)} = u.${quoteIdentifier(parentColumn.columnName)}`;
  }

  const activeExpression = booleanSql(schema.isActive);
  let deletedExpression = 'CAST(0 AS bit)';
  if (schema.deleted) {
    const deletedReference = `u.${quoteIdentifier(schema.deleted.columnName)}`;
    deletedExpression = normalize(schema.deleted.dataType) === 'bit'
      ? `CASE WHEN ${deletedReference} = 1 THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END`
      : `CASE WHEN ${deletedReference} IS NULL THEN CAST(0 AS bit) ELSE CAST(1 AS bit) END`;
  }

  return pool.request().query(`
    SELECT
      u.${quoteIdentifier(schema.email.columnName)} AS email,
      u.${quoteIdentifier(schema.fullName.columnName)} AS fullName,
      ${activeExpression} AS isActive,
      ${deletedExpression} AS isDeleted
    FROM ${userTable} u
    ${resolvedJoin}
    WHERE UPPER(LTRIM(RTRIM(CONVERT(nvarchar(100), ${roleReference})))) = 'ADMIN'
    ORDER BY u.${quoteIdentifier(schema.email.columnName)};
  `);
}

export async function listProductionAdmins({ poolPromise, env = process.env, log = console.log }) {
  if (!shouldListProductionAdmins(env, log)) return { skipped: true };

  const pool = await poolPromise;
  const { metadata, foreignKeys } = await readSchema(pool);
  const schema = discoverUserSchema(metadata, foreignKeys);

  if (schema.roleJoin) {
    const columns = metadata.columns;
    schema.roleJoin.parentColumn = exactlyOne(
      columns.filter((column) => column.objectId === schema.userTable.objectId
        && column.columnId === schema.roleJoin.roleForeignKey.parentColumnId),
      'role FK parent column',
    );
    schema.roleJoin.referencedColumn = exactlyOne(
      columns.filter((column) => column.objectId === schema.roleJoin.roleTable.objectId
        && column.columnId === schema.roleJoin.roleForeignKey.referencedColumnId),
      'role FK referenced column',
    );
  }

  const result = await queryAdmins(pool, schema);
  const admins = result.recordset;
  for (const admin of admins) {
    log(`ADMIN_ACCOUNT email=${admin.email} fullName=${admin.fullName} isActive=${Boolean(admin.isActive)} isDeleted=${Boolean(admin.isDeleted)}`);
  }
  const activeCount = admins.filter((admin) => admin.isActive && !admin.isDeleted).length;
  log(`ACTIVE_ADMIN_COUNT=${activeCount}`);
  log(`TOTAL_ADMIN_COUNT=${admins.length}`);
  return { skipped: false, activeCount, totalCount: admins.length };
}
