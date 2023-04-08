import { Router } from 'express';
import { ReceiveBillController } from '../controller/receive-bill-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new ReceiveBillController().index);

router.get('/:id', userAuthenticated, new ReceiveBillController().show);

router.put('/:id', userAuthenticated, new ReceiveBillController().update);

export default router;
