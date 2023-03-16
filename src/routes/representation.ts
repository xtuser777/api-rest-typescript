import { Router } from 'express';
import { RepresentationController } from '../controller/representation-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new RepresentationController().index);

router.get('/:id', userAuthenticated, new RepresentationController().show);

router.post('/', userAuthenticated, new RepresentationController().store);

router.put('/:id', userAuthenticated, new RepresentationController().update);

router.delete('/:id', userAuthenticated, new RepresentationController().delete);

export default router;
