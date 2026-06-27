import bcrypt from 'bcryptjs';

export async function hashPassword(plainPassword) {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  return bcrypt.hash(plainPassword, saltRounds);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}