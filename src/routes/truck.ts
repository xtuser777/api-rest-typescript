import { Router } from 'express';
import { TruckController } from '../controller/truck-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new TruckController().index);

router.get('/:id', userAuthenticated, new TruckController().show);

router.post('/', userAuthenticated, new TruckController().store);

router.put('/:id', userAuthenticated, new TruckController().update);

router.delete('/:id', userAuthenticated, new TruckController().delete);

export default router;
