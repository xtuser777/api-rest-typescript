import { Router } from 'express';
import { LevelController } from '../controller/level-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new LevelController().index);

router.get('/:id', userAuthenticated, new LevelController().show);

export default router;
