import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';
import * as userService from './userService.js';

// Hash falso para comparar siempre: evita revelar por tiempo de respuesta si el email existe.
const DUMMY_HASH = bcrypt.hashSync('contraseña-inexistente', 12);

const issueToken = (user) =>
  jwt.sign({ role: user.role }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn,
  });

export async function login(email, password) {
  const user = userService.findByEmail(email);
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, 'Credenciales inválidas');
  return { user: userService.toPublic(user), token: issueToken(user) };
}

/** Registro abierto: el rol SIEMPRE es 'editor' y los términos deben estar aceptados (lo valida la ruta). */
export async function register({ email, username, password }) {
  const user = await userService.create({
    email,
    username,
    password,
    role: 'editor',
    termsAccepted: true,
  });
  return { user, token: issueToken(user) };
}

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);
