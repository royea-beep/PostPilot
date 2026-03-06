import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is required');
  return secret;
}

interface TokenPayload {
  userId: string;
  email: string;
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, getJwtRefreshSecret(), { expiresIn: '7d' });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, getJwtSecret()) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, getJwtRefreshSecret()) as TokenPayload;

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
