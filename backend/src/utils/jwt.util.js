import jwt from 'jsonwebtoken';
import { normalizeRole } from '../constants/roles.js';

function parseExpiresInToSeconds(value) {
  const raw = String(value || '1d').trim();

  if (/^\d+$/.test(raw)) return Number(raw);

  const match = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 's') return amount;
  if (unit === 'm') return amount * 60;
  if (unit === 'h') return amount * 60 * 60;
  if (unit === 'd') return amount * 24 * 60 * 60;

  return null;
}

export function generateToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  const role = normalizeRole(user.Role || user.role);
  const id = user.Id || user.id || user.UserId;

  const token = jwt.sign(
    {
      sub: String(id),
      id,
      email: user.Email || user.email,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn,
    }
  );

  return {
    token,
    expiresIn: parseExpiresInToSeconds(expiresIn),
  };
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
