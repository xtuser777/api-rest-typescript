import { Router } from 'express';
import { TruckTypeController } from '../controller/truck-type-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new TruckTypeController().index);

router.get('/:id', userAuthenticated, new TruckTypeController().show);

router.post('/', userAuthenticated, new TruckTypeController().store);

router.put('/:id', userAuthenticated, new TruckTypeController().update);

router.delete('/:id', userAuthenticated, new TruckTypeController().delete);

export default router;
