import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateLogin } from '../middlewares/validate.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Demasiados intentos. Intenta de nuevo más tarde.' } },
});

const router = Router();
router.post('/login', loginLimiter, validateLogin, ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);

export default router;
