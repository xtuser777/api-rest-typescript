import { Router } from 'express';
import { PaymentFormController } from '../controller/payment-form-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new PaymentFormController().index);

router.get('/:id', userAuthenticated, new PaymentFormController().show);

router.post('/', userAuthenticated, new PaymentFormController().store);

router.put('/:id', userAuthenticated, new PaymentFormController().update);

router.delete('/:id', userAuthenticated, new PaymentFormController().delete);

export default router;
