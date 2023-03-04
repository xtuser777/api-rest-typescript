import { Router } from 'express';
import { TokenController } from '../controller/token-controller';

const router = Router();

router.post('/', new TokenController().store);

export default router;
