import { Router } from 'express';
import { OrderStatusController } from '../controller/order-status-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new OrderStatusController().index);

router.get('/:status/:order', userAuthenticated, new OrderStatusController().show);

router.put('/:order', userAuthenticated, new OrderStatusController().update);

export default router;
