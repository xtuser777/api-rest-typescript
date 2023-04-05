import { Router } from 'express';
import { StatusController } from '../controller/status-controller';

const router = Router();

router.get('/', new StatusController().index);

router.get('/:id', new StatusController().show);

export default router;
