import { config } from '../config.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';

const cookieBase = {
  httpOnly: true,            // JS del navegador no puede leerla (mitiga robo por XSS)
  sameSite: 'strict',        // no se envía en peticiones desde otros sitios (mitiga CSRF)
  secure: config.isProd,     // solo HTTPS en producción
  path: '/',
};

function startSession(req, res, { user, token }, status = 200) {
  res.cookie(config.cookieName, token, { ...cookieBase, maxAge: config.cookieMaxAgeMs });
  // Clientes de API (no navegador) pueden pedir el token en el cuerpo para usar Bearer.
  const body = req.get('X-Auth-Mode') === 'bearer' ? { data: user, token } : { data: user };
  res.status(status).json(body);
}

export const login = asyncHandler(async (req, res) => {
  startSession(req, res, await authService.login(req.body.email, req.body.password));
});

export const register = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body; // el rol NUNCA se toma del cliente
  startSession(req, res, await authService.register({ email, username, password }), 201);
});

export const logout = (req, res) => {
  res.clearCookie(config.cookieName, cookieBase);
  res.status(204).end();
};

export const me = (req, res) => res.json({ data: req.user });
