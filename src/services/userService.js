import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { HttpError } from '../utils/httpError.js';

const BCRYPT_COST = 12;

export const findByEmail = (email) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim());

export const findById = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
export const count = () => db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
// Nunca exponemos password_hash fuera del servicio.
export const toPublic = (user) => ({ id: user.id, email: user.email, role: user.role });

export async function create({ email, password, role = 'editor' }) {
  if (!['admin', 'editor'].includes(role)) throw new HttpError(400, 'Rol inválido');
  if (findByEmail(email)) throw new HttpError(409, 'El email ya está registrado');
  const hash = await bcrypt.hash(password, BCRYPT_COST);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)')
    .run(String(email).trim(), hash, role);
  return toPublic(findById(info.lastInsertRowid));
}
