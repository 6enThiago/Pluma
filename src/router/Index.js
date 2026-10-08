import { Router } from 'express';
import authRoutes from './authRoutes.js';
import publicPostRoutes from './publicPostRoutes.js';
import adminPostRoutes from './adminPostRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', publicPostRoutes);
router.use('/admin/posts', adminPostRoutes);

export default router;
