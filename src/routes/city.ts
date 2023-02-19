import { Router } from 'express';
import { CityController } from '../controller/city-controller';

const router = Router();

router.get('/', new CityController().get);

router.get('/state/:id', new CityController().getState);

router.get('/id/:id', new CityController().getById);

router.get('/state/:state', new CityController().getByState);

router.get('/name/:name', new CityController().getByName);

router.get('/state/:state/name/:name', new CityController().getByStateName);

export default router;
