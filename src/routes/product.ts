import { Router } from 'express';
import { ProductController } from '../controller/product-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new ProductController().index);

router.get('/:id', userAuthenticated, new ProductController().show);

router.post('/', userAuthenticated, new ProductController().store);

router.put('/:id', userAuthenticated, new ProductController().update);

router.delete('/:id', userAuthenticated, new ProductController().delete);

export default router;
