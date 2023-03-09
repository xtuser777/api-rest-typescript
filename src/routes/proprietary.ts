import { Router } from 'express';
import { ProprietaryController } from '../controller/proprietary-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new ProprietaryController().index);

router.get('/:id', userAuthenticated, new ProprietaryController().show);

router.post('/', userAuthenticated, new ProprietaryController().store);

router.put('/:id', userAuthenticated, new ProprietaryController().update);

router.delete('/:id', userAuthenticated, new ProprietaryController().delete);

export default router;
