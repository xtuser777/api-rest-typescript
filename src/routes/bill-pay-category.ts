import { Router } from 'express';
import { BillPayCategoryController } from '../controller/bill-pay-category-controller';
import userAuthenticated from '../middleware/user-authenticated';

const router = Router();

router.get('/', userAuthenticated, new BillPayCategoryController().index);

router.get('/:id', userAuthenticated, new BillPayCategoryController().show);

router.post('/', userAuthenticated, new BillPayCategoryController().store);

router.put('/:id', userAuthenticated, new BillPayCategoryController().update);

router.delete('/:id', userAuthenticated, new BillPayCategoryController().delete);

export default router;
