import assert from 'node:assert/strict';
import test from 'node:test';
import {
  discoverUserSchema,
  listProductionAdmins,
  shouldListProductionAdmins,
} from '../src/database/scripts/list-production-admins.js';

test('production admin diagnosis skips locally without touching a pool', async () => {
  const logs = [];
  let poolAwaited = false;
  const poolPromise = { then() { poolAwaited = true; throw new Error('pool must not be used'); } };
  const result = await listProductionAdmins({
    poolPromise,
    env: {
      NODE_ENV: 'development',
      RENDER: 'false',
      LIST_ADMINS_ON_BOOT: 'true',
      LIST_ADMINS_CONFIRM: 'LIST_PRODUCTION_ADMINS_2026',
      DB_SERVER: 'localhost',
    },
    log: (message) => logs.push(message),
  });

  assert.deepEqual(result, { skipped: true });
  assert.equal(poolAwaited, false);
  assert.deepEqual(logs, ['LIST_ADMINS_SKIPPED']);
});

test('diagnosis requires the exact confirmation in Render production', () => {
  assert.throws(() => shouldListProductionAdmins({
    NODE_ENV: 'production',
    RENDER: 'true',
    LIST_ADMINS_ON_BOOT: 'true',
    LIST_ADMINS_CONFIRM: 'wrong',
    DB_SERVER: 'production-sql.example',
  }, () => {}), /LIST_ADMINS_CONFIRM is invalid/);
});

test('schema discovery uses the actual Users metadata and direct Role column', () => {
  const tables = [{ objectId: 1, schemaName: 'dbo', tableName: 'Users' }];
  const columns = [
    ['Email', 'nvarchar'], ['FullName', 'nvarchar'], ['Role', 'nvarchar'],
    ['IsActive', 'bit'], ['DeletedAt', 'datetime2'],
  ].map(([columnName, dataType], index) => ({
    objectId: 1, columnId: index + 1, columnName, dataType,
  }));
  const schema = discoverUserSchema({ tables, columns }, []);

  assert.equal(schema.userTable.tableName, 'Users');
  assert.equal(schema.directRole.columnName, 'Role');
  assert.equal(schema.deleted.columnName, 'DeletedAt');
});
