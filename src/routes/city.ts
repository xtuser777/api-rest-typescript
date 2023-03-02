import { Router } from 'express';
import { CityController } from '../controller/city-controller';

const router = Router();

router.get('/', new CityController().index);

router.get('/:id', new CityController().show);

export default router;
