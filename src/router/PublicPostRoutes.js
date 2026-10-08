import { Router } from 'express';
import * as ctrl from '../controllers/postController.js';
import { validateListQuery, validateSlug } from '../middlewares/validate.js';

const router = Router();
router.param('slug', validateSlug);

router.get('/', validateListQuery, ctrl.listPublic);
router.get('/:slug', ctrl.getPublic);               

export default router;
