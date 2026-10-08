import { Router } from 'express';
import * as ctrl from '../controllers/postController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  validateId,
  validateListQuery,
  validatePostCreate,
  validatePostUpdate,
  validateStatusBody,
} from '../middlewares/validate.js';

const router = Router();

// Todo lo de /api/admin/posts exige sesión válida + rol admin o editor.
router.use(authenticate, authorize('admin', 'editor'));
router.param('id', validateId);

router.get('/', validateListQuery, ctrl.listAdmin);            
router.get('/:id', ctrl.getAdmin);                              
router.post('/', validatePostCreate, ctrl.create);              
router.patch('/:id', validatePostUpdate, ctrl.update);          
router.patch('/:id/status', validateStatusBody, ctrl.setStatus); 
router.delete('/:id', authorize('admin'), ctrl.remove);          

export default router;
