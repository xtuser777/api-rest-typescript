import { Router } from 'express';
import { EmployeeController } from '../controller/employee-controller';

const router = Router();

router.get('/', new EmployeeController().get);

// router.get('/id/:id', new EmployeeController().getById);

router.get('/desactivate/:id', new EmployeeController().desactivate);

router.get('/reactivate/:id', new EmployeeController().reactivate);

export default router;
