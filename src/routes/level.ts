import { Router } from 'express';
import { LevelController } from '../controller/level-controller';

const router = Router();

router.get('/', new LevelController().get);

router.get('/id/:id', new LevelController().getById);

export default router;
