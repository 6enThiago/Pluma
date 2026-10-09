import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';
import * as userService from './userService.js';
// Hash falso para comparar siempre: evita revelar por tiempo de respuesta si el email existe.
const DUMMY_HASH = bcrypt.hashSync('contraseña-inexistente', 12);

export async function login(email, password) {
  const user = userService.findByEmail(email);
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, 'Credenciales inválidas');

  const token = jwt.sign({ role: user.role }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn,
  });
  return { user: userService.toPublic(user), token };
}

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);
