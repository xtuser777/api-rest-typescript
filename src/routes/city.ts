import { Router } from 'express';
import { CityController } from '../controller/city-controller';

const router = Router();

router.get('/:function/:value?', new CityController().index);

export default router;
