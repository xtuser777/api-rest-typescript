import { Router } from 'express';
import { EmployeeController } from '../controller/employee-controller';

const router = Router();

router.get('/', new EmployeeController().get);

router.get('/filter/:filter', new EmployeeController().getByFilter);

router.get('/admission/:admission', new EmployeeController().getByAdmission);

router.get('/desactivate/:id', new EmployeeController().desactivate);

router.get('/reactivate/:id', new EmployeeController().reactivate);

export default router;
