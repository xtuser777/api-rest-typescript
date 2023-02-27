import { Router } from 'express';
import { EmployeeController } from '../controller/employee-controller';

const router = Router();

router.get('/', new EmployeeController().index);

router.get('/:id', new EmployeeController().show);

router.get('/desactivate/:id', new EmployeeController().desactivate);

router.get('/reactivate/:id', new EmployeeController().reactivate);

export default router;
