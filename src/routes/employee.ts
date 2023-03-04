import { Router } from 'express';
import { EmployeeController } from '../controller/employee-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new EmployeeController().index);

router.get('/:id', userAuthenticated, new EmployeeController().show);

router.post('/', userAuthenticated, new EmployeeController().store);

router.put('/:id', userAuthenticated, new EmployeeController().update);

router.delete('/:id', userAuthenticated, new EmployeeController().delete);

export default router;
