import { Router } from 'express';
import { ClientController } from '../controller/client-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new ClientController().index);

router.get('/:id', userAuthenticated, new ClientController().show);

router.post('/', userAuthenticated, new ClientController().store);

router.put('/:id', userAuthenticated, new ClientController().update);

router.delete('/:id', userAuthenticated, new ClientController().delete);

export default router;
