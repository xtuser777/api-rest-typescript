import { Router } from 'express';
import { SaleBudgetController } from '../controller/sale-budget-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new SaleBudgetController().index);

router.get('/:id', userAuthenticated, new SaleBudgetController().show);

router.post('/', userAuthenticated, new SaleBudgetController().store);

router.put('/:id', userAuthenticated, new SaleBudgetController().update);

router.delete('/:id', userAuthenticated, new SaleBudgetController().delete);

export default router;
