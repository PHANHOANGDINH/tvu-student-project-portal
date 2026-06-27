// src/utils/jwt.util.js
import jwt from 'jsonwebtoken';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.Id,
      email: user.Email,
      role: user.Role,
      fullName: user.FullName,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}