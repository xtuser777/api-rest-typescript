import { Router } from 'express';
import { StateController } from '../controller/state-controller';

const router = Router();

router.get('/', new StateController().get);

router.get('/id/:id', new StateController().getById);

router.get('/name/:name', new StateController().getByName);

export default router;
