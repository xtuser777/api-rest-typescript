import { Router } from 'express';
import { EmployeeController } from '../controller/employee-controller';

const router = Router();

router.get('/', new EmployeeController().index);

router.get('/:id', new EmployeeController().show);

router.post('/', new EmployeeController().store);

router.put('/:id', new EmployeeController().update);

router.delete('/:id', new EmployeeController().delete);

export default router;
