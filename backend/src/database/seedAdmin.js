import { findUserByEmail, createUser } from '../modules/auth/auth.repository.js';
import { hashPassword } from '../utils/password.util.js';

export async function seedAdmin() {
  const adminEmail = 'admin@tvu.edu.vn';

  const existedAdmin = await findUserByEmail(adminEmail);

  if (existedAdmin) {
    console.log('Admin mặc định đã tồn tại.');
    return;
  }

  const passwordHash = await hashPassword('admin123');

  await createUser({
    fullName: 'Quản trị viên',
    email: adminEmail,
    passwordHash,
    role: 'ADMIN',
    userCode: 'ADMIN001'
  });

  console.log('Đã tạo admin mặc định: admin@tvu.edu.vn / admin123');
}