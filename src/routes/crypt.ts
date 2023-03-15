import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';

const router = Router();

router.get('/:password', async (req: Request, res: Response): Promise<Response> => {
  const password = req.params.password;
  const crypt = await bcryptjs.hash(password, 8);
  return res.json(crypt);
});

export default router;
