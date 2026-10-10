import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateLogin, validateRegister } from '../middlewares/validate.js';

const limiter = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { message: 'Demasiados intentos. Intenta de nuevo más tarde.' } },
  });

const loginLimiter = limiter(15 * 60 * 1000, 10);
const registerLimiter = limiter(60 * 60 * 1000, 5); // 5 altas por hora por IP

const router = Router();
router.post('/register', registerLimiter, validateRegister, ctrl.register);
router.post('/login', loginLimiter, validateLogin, ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);

export default router;
