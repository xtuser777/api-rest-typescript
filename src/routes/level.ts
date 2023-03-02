import { Router } from 'express';
import { LevelController } from '../controller/level-controller';

const router = Router();

router.get('/', new LevelController().index);

router.get('/:id', new LevelController().show);

export default router;
