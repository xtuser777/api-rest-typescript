import { Router } from 'express';
import { BillPayController } from '../controller/bill-pay-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new BillPayController().index);

router.get('/:id', userAuthenticated, new BillPayController().show);

router.post('/', userAuthenticated, new BillPayController().store);

router.put('/:id', userAuthenticated, new BillPayController().update);

router.delete('/:id', userAuthenticated, new BillPayController().delete);

export default router;
