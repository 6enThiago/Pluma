import { HttpError } from '../utils/httpError.js';

export const notFound = (req, res, next) => next(new HttpError(404, 'Ruta no encontrada'));

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'JSON malformado' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'Cuerpo demasiado grande' } });
  }
  if (String(err.code).startsWith('SQLITE_CONSTRAINT')) {
    return res.status(409).json({ error: { message: 'Conflicto con datos existentes' } });
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Error interno del servidor' } });
}
