import { Router } from 'express';
import { FreightOrderController } from '../controller/freight-order-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new FreightOrderController().index);

router.get('/:id', userAuthenticated, new FreightOrderController().show);

router.post('/', userAuthenticated, new FreightOrderController().store);

router.delete('/:id', userAuthenticated, new FreightOrderController().delete);

export default router;
