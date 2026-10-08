import { config } from '../config.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';

const cookieBase = {
  httpOnly: true,            // JS del navegador no puede leerla (mitiga robo por XSS)
  sameSite: 'strict',        // no se envía en peticiones desde otros sitios (mitiga CSRF)
  secure: config.isProd,     // solo HTTPS en producción
  path: '/',
};
export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body.email, req.body.password);
  res.cookie(config.cookieName, token, { ...cookieBase, maxAge: config.cookieMaxAgeMs });
  const body = req.get('X-Auth-Mode') === 'bearer' ? { data: user, token } : { data: user };
  res.json(body);
});
export const logout = (req, res) => {
  res.clearCookie(config.cookieName, cookieBase);
  res.status(204).end();
};
export const me = (req, res) => res.json({ data: req.user });
