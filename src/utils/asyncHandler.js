// Express 4 no captura promesas rechazadas: este wrapper las envía al errorHandler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
