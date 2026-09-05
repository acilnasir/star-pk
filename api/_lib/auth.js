import crypto from 'node:crypto';
import { sql } from './db.js';

const COOKIE_NAME = 'starpk_session';
const SESSION_DAYS = 7;
const secret = process.env.AUTH_SECRET || process.env.NEON_AUTH_SECRET || (process.env.NODE_ENV === 'production' ? null : 'local-development-secret');

if (!secret) {
  throw new Error('AUTH_SECRET is not configured');
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function encodeSession(userId) {
  const payload = base64url(JSON.stringify({ userId, exp: Date.now() + SESSION_DAYS * 86400000 }));
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value) {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  const expected = sign(payload || '');
  if (!payload || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  return data.exp > Date.now() ? data.userId : null;
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

export async function currentUser(request) {
  const userId = decodeSession(parseCookies(request)[COOKIE_NAME]);
  if (!userId) return null;
  const rows = await sql`SELECT id, email, name, role, provinsi, kabupaten_kota, unit_kerja, jabatan, nip FROM users WHERE id = ${userId}`;
  return rows[0] || null;
}

export function setSession(response, userId) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeSession(userId)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
}

export function clearSession(response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0`);
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export { COOKIE_NAME };
