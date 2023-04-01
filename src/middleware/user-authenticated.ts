import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../model/user';
import Database from '../util/database';
import { ActiveUser } from '../util/active-user';

export default async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).json({ errors: ['Acesso negado.'] });

  const [, token] = authorization.split(' ');

  try {
    const dados = jwt.verify(token, process.env.TOKEN_SECRET as string) as jwt.JwtPayload;

    await Database.instance.open();
    const user = (await new User().find({ id: dados.id }))[0];
    await Database.instance.close();
    if (!user) return res.status(401).json({ errors: ['Usuário inválido.'] });

    ActiveUser.getInstance({
      id: user.getId(),
      login: user.getLogin(),
      level: user.getLevelId(),
    });

    return next();
  } catch (e) {
    console.error(e);
    return res.status(401).json({ errors: ['Token inválido ou expirado.'] });
  }
};
