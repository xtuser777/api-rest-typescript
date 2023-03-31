import { Router } from 'express';
import { SalesOrderController } from '../controller/sales-order-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new SalesOrderController().index);

router.get('/:id', userAuthenticated, new SalesOrderController().show);

router.post('/', userAuthenticated, new SalesOrderController().store);

router.delete('/:id', userAuthenticated, new SalesOrderController().delete);

export default router;
