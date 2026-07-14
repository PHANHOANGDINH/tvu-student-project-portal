-- Normalize legacy user roles to ADMIN, LECTURER, STUDENT.
-- Review affected rows before running this script on a shared database.
-- This script does not delete data and does not reset the database.

BEGIN TRANSACTION;

UPDATE Users
SET Role = CASE
  WHEN Role IN ('Admin', 'admin', 'ADMIN') THEN 'ADMIN'
  WHEN Role IN ('Teacher', 'teacher', 'TEACHER', 'Lecturer', 'lecturer', 'LECTURER', 'GIANGVIEN', 'GiangVien') THEN 'LECTURER'
  WHEN Role IN ('Student', 'student', 'STUDENT', 'SINHVIEN', 'SinhVien') THEN 'STUDENT'
  ELSE Role
END,
UpdatedAt = SYSDATETIME()
WHERE Role IN (
  'Admin', 'admin', 'Teacher', 'teacher', 'TEACHER', 'Lecturer', 'lecturer', 'GIANGVIEN', 'GiangVien',
  'Student', 'student', 'SINHVIEN', 'SinhVien'
);

SELECT Role, COUNT(*) AS Total
FROM Users
GROUP BY Role;

COMMIT TRANSACTION;
