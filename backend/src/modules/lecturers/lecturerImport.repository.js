import { poolPromise, sql } from '../../config/db.js';

export async function findExisting(rows) {
  if (!rows.length) return [];
  const pool=await poolPromise,request=pool.request(),clauses=[];
  rows.forEach((row,index)=>{request.input(`Email${index}`,sql.NVarChar(150),row.email);request.input(`Code${index}`,sql.NVarChar(50),row.lecturerCode);clauses.push(`Email=@Email${index}`,`UserCode=@Code${index}`);});
  const result=await request.query(`SELECT Id id,Email email,UserCode lecturerCode FROM Users WHERE DeletedAt IS NULL AND (${clauses.join(' OR ')})`);
  return result.recordset;
}

export async function importLecturers(rows) {
  const pool=await poolPromise,transaction=new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const created=[];
    for (const row of rows) {
      const duplicate=await new sql.Request(transaction).input('Email',sql.NVarChar(150),row.email).input('Code',sql.NVarChar(50),row.lecturerCode).query(`SELECT TOP 1 Id FROM Users WITH(UPDLOCK,HOLDLOCK) WHERE DeletedAt IS NULL AND (Email=@Email OR UserCode=@Code)`);
      if(duplicate.recordset[0]){const error=new Error(`Dữ liệu dòng ${row.rowNumber} đã tồn tại.`);error.statusCode=409;throw error;}
      const inserted=await new sql.Request(transaction).input('Name',sql.NVarChar(100),row.fullName).input('Email',sql.NVarChar(150),row.email).input('Hash',sql.NVarChar(255),row.passwordHash).input('Code',sql.NVarChar(50),row.lecturerCode).query(`INSERT Users(FullName,Email,PasswordHash,Role,IsActive,UserCode) OUTPUT INSERTED.Id id,INSERTED.UserCode lecturerCode,INSERTED.FullName fullName,INSERTED.Email email VALUES(@Name,@Email,@Hash,'LECTURER',1,@Code)`);
      created.push(inserted.recordset[0]);
    }
    await transaction.commit();return created;
  } catch(error){await transaction.rollback();throw error;}
}

export async function listLecturers() {
  const pool=await poolPromise,result=await pool.request().query(`SELECT UserCode lecturerCode,FullName fullName,Email email,IsActive isActive,CreatedAt createdAt FROM Users WHERE Role='LECTURER' AND DeletedAt IS NULL ORDER BY FullName`);
  return result.recordset;
}
