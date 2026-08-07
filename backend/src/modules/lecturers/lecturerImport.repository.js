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
      const inserted=await new sql.Request(transaction).input('Name',sql.NVarChar(100),row.fullName).input('Email',sql.NVarChar(150),row.email).input('Hash',sql.NVarChar(255),row.passwordHash).input('Code',sql.NVarChar(50),row.lecturerCode).input('AcademicDegree',sql.NVarChar(100),row.academicDegree||null).query(`INSERT Users(FullName,Email,PasswordHash,Role,IsActive,UserCode,AcademicDegree) OUTPUT INSERTED.Id id,INSERTED.UserCode lecturerCode,INSERTED.FullName fullName,INSERTED.Email email,INSERTED.AcademicDegree academicDegree VALUES(@Name,@Email,@Hash,'LECTURER',1,@Code,@AcademicDegree)`);
      created.push(inserted.recordset[0]);
    }
    await transaction.commit();return created;
  } catch(error){await transaction.rollback();throw error;}
}

export async function listLecturers({ facultyId = null } = {}) {
  const pool=await poolPromise,result=await pool.request().input('FacultyId',sql.Int,Number(facultyId)||null).query(`SELECT u.UserCode lecturerCode,u.FullName fullName,u.Email email,u.Department department,u.AcademicDegree academicDegree,u.IsActive isActive,u.CreatedAt createdAt FROM Users u LEFT JOIN Faculties f ON f.FacultyName=u.Department AND f.DeletedAt IS NULL WHERE u.Role='LECTURER' AND u.DeletedAt IS NULL AND (@FacultyId IS NULL OR f.Id=@FacultyId) ORDER BY u.FullName`);
  return result.recordset;
}
