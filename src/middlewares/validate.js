import { HttpError } from '../utils/httpError.js';

export const STATUSES = ['draft', 'published'];

const fail = (errors) => new HttpError(400, 'Datos inválidos', errors);

export function validateLogin(req, res, next) {
  const { email, password } = req.body ?? {};
  const errors = [];
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) errors.push('email inválido');
  // bcrypt solo considera los primeros 72 bytes
  if (typeof password !== 'string' || !password || password.length > 72) errors.push('password inválida');
  errors.length ? next(fail(errors)) : next();
}

const RESERVED_USERNAMES = ['admin', 'administrador', 'root', 'soporte', 'moderador', 'sistema', 'staff', 'cms', 'api'];

export function validateRegister(req, res, next) {
  const { email, username, password, acceptTerms } = req.body ?? {};
  const errors = [];
  if (typeof email !== 'string' || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) errors.push('email inválido');
  if (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    errors.push('username: 3 a 30 caracteres (letras, números y guion bajo)');
  } else if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    errors.push('username: ese nombre está reservado');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    errors.push('password: entre 8 y 72 caracteres');
  }
  if (acceptTerms !== true) errors.push('Debes leer el aviso y aceptar los términos para crear la cuenta');
  errors.length ? next(fail(errors)) : next();
}

function checkPostFields(body, { requireTitle }) {
  const { title, content, status } = body ?? {};
  const errors = [];
  if (title === undefined ? requireTitle : typeof title !== 'string' || !title.trim() || title.length > 200) {
    errors.push('title: requerido, texto de hasta 200 caracteres');
  }
  if (content !== undefined && (typeof content !== 'string' || content.length > 200_000)) {
    errors.push('content: debe ser texto de hasta 200.000 caracteres');
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    errors.push(`status: debe ser ${STATUSES.join(' o ')}`);
  }
  return errors;
}

export function validatePostCreate(req, res, next) {
  const errors = checkPostFields(req.body, { requireTitle: true });
  errors.length ? next(fail(errors)) : next();
}

export function validatePostUpdate(req, res, next) {
  const body = req.body ?? {};
  if (!['title', 'content', 'status'].some((k) => body[k] !== undefined)) {
    return next(fail(['Envía al menos uno de: title, content, status']));
  }
  const errors = checkPostFields(body, { requireTitle: false });
  errors.length ? next(fail(errors)) : next();
}

export function validateStatusBody(req, res, next) {
  STATUSES.includes(req.body?.status)
    ? next()
    : next(fail([`status: debe ser ${STATUSES.join(' o ')}`]));
}

/** Para router.param('id', validateId): convierte y valida el :id de la ruta. */
export function validateId(req, res, next, value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) return next(new HttpError(400, 'Id inválido'));
  req.params.id = id;
  next();
}

export function validateSlug(req, res, next, value) {
  return /^[a-z0-9-]{1,100}$/.test(value) ? next() : next(new HttpError(400, 'Slug inválido'));
}

/** Query params ?page=2&limit=10&status=published → req.query normalizado. */
export function validateListQuery(req, res, next) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
  const { status } = req.query;
  const errors = [];
  if (!Number.isInteger(page) || page < 1) errors.push('page: entero >= 1');
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) errors.push('limit: entero entre 1 y 50');
  if (status !== undefined && !STATUSES.includes(status)) errors.push(`status: ${STATUSES.join(' o ')}`);
  if (errors.length) return next(fail(errors));
  req.listQuery = { page, limit, status };
  next();
}
