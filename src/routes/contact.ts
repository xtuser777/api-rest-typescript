import { Router, Request, Response } from 'express';
import isEmail from 'validator/lib/isEmail';

const router = Router();

router.get('/', (req: Request, res: Response): Response => {
  if (Object.keys(req.body).length == 0)
    return res.status(400).json('Requisicao sem corpo.');

  if (req.body.validateEmail) {
    const email = req.body.validateEmail;
    return res.json(isEmail(email));
  }

  return res.json('');
});

export default router;
