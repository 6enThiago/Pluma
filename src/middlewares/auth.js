import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
/** Autenticación: acepta "Authorization: Bearer <token>" o la cookie HttpOnly. */
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.[config.cookieName];
  if (!token) return next(new HttpError(401, 'No autenticado'));

  try {
    const payload = authService.verifyToken(token);
    // Se relee el usuario en la BD: si lo borraron o le cambiaron el rol, el token viejo no vale.
    const user = userService.findById(Number(payload.sub));
    if (!user) return next(new HttpError(401, 'Usuario inexistente'));
    req.user = userService.toPublic(user);
    next();
  } catch {
    next(new HttpError(401, 'Token inválido o expirado'));
  }
}
/** Autorización por rol: authorize('admin') o authorize('admin', 'editor'). */
export const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'Permisos insuficientes'));
