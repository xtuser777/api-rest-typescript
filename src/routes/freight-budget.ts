import { Router } from 'express';
import { FreightBudgetController } from '../controller/freight-budget-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new FreightBudgetController().index);

router.get('/:id', userAuthenticated, new FreightBudgetController().show);

router.post('/', userAuthenticated, new FreightBudgetController().store);

router.put('/:id', userAuthenticated, new FreightBudgetController().update);

router.delete('/:id', userAuthenticated, new FreightBudgetController().delete);

export default router;
