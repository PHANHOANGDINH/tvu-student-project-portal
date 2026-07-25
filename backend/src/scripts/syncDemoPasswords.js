import 'dotenv/config';
import { hashPassword } from '../utils/password.util.js';

if (String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production') {
  throw new Error('seed:demo-passwords is disabled when NODE_ENV=production.');
}

const passwords = {
  LECTURER: process.env.DEMO_LECTURER_PASSWORD,
  STUDENT: process.env.DEMO_STUDENT_PASSWORD,
};

for (const [role, password] of Object.entries(passwords)) {
  if (!password) throw new Error(`Missing demo password for role ${role}.`);
}

const accounts = [
  { code: 'GV001', email: 'thiennhd@tvu.edu.vn', role: 'LECTURER' },
  { code: 'GV002', email: 'annb@tvu.edu.vn', role: 'LECTURER' },
  { code: 'SV001', email: 'sv001@tvu.edu.vn', role: 'STUDENT' },
  { code: 'SV002', email: 'sv002@tvu.edu.vn', role: 'STUDENT' },
  { code: 'SV003', email: 'sv003@tvu.edu.vn', role: 'STUDENT' },
];

const hashes = {
  LECTURER: await hashPassword(passwords.LECTURER),
  STUDENT: await hashPassword(passwords.STUDENT),
};

const { poolPromise, sql } = await import('../config/db.js');
const pool = await poolPromise;
const transaction = new sql.Transaction(pool);

try {
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  for (const account of accounts) {
    const result = await new sql.Request(transaction)
      .input('Code', sql.NVarChar(50), account.code)
      .input('Email', sql.NVarChar(150), account.email)
      .input('Role', sql.NVarChar(20), account.role)
      .input('PasswordHash', sql.NVarChar(255), hashes[account.role])
      .query(`
        UPDATE Users
        SET PasswordHash = @PasswordHash, IsActive = 1, UpdatedAt = SYSDATETIME()
        WHERE UserCode = @Code AND Email = @Email AND Role = @Role AND DeletedAt IS NULL;
      `);
    if (result.rowsAffected[0] !== 1) {
      throw new Error(`Expected exactly one active demo account for ${account.code}.`);
    }
  }
  await transaction.commit();
  console.log(`Demo passwords synchronized for ${accounts.map(({ code }) => code).join(', ')}.`);
} catch (error) {
  try {
    await transaction.rollback();
  } catch {
    // Transaction was already rolled back or never started.
  }
  throw error;
} finally {
  await pool.close();
}
