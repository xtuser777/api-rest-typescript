import { Router } from 'express';
import { ParameterizationController } from '../controller/parameterization-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new ParameterizationController().index);

router.post('/', userAuthenticated, new ParameterizationController().store);

router.put('/', userAuthenticated, new ParameterizationController().update);

export default router;
