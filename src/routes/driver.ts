import { Router } from 'express';
import { DriverController } from '../controller/driver-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new DriverController().index);

router.get('/:id', userAuthenticated, new DriverController().show);

router.post('/', userAuthenticated, new DriverController().store);

// router.put('/:id', userAuthenticated, new TruckTypeController().update);

// router.delete('/:id', userAuthenticated, new TruckTypeController().delete);

export default router;
