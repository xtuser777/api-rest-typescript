import { Router } from 'express';
import { PersonController } from '../controller/person-controller';

const router = Router();

router.get('/', new PersonController().index);

export default router;
