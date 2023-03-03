import { Router } from 'express';
import { ParameterizationController } from '../controller/parameterization-controller';

const router = Router();

router.get('/', new ParameterizationController().index);

router.post('/', new ParameterizationController().store);

router.put('/', new ParameterizationController().update);

export default router;
