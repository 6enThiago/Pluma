import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { HttpError } from '../utils/httpError.js';

const BCRYPT_COST = 12;

export const findByEmail = (email) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim());

export const findByUsername = (username) =>
  db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).trim());

export const findById = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);

export const count = () => db.prepare('SELECT COUNT(*) AS n FROM users').get().n;

// Nunca exponemos password_hash fuera del servicio.
export const toPublic = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
});

export async function create({ email, username, password, role = 'editor', termsAccepted = false }) {
  if (!['admin', 'editor'].includes(role)) throw new HttpError(400, 'Rol inválido');
  if (findByEmail(email)) throw new HttpError(409, 'El email ya está registrado');
  if (findByUsername(username)) throw new HttpError(409, 'El nombre de usuario ya está en uso');

  const hash = await bcrypt.hash(password, BCRYPT_COST);
  const info = db
    .prepare(
      `INSERT INTO users (email, username, password_hash, role, terms_accepted_at, terms_version)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      String(email).trim(),
      String(username).trim(),
      hash,
      role,
      termsAccepted ? new Date().toISOString() : null,
      termsAccepted ? config.termsVersion : null,
    );
  return toPublic(findById(info.lastInsertRowid));
}
