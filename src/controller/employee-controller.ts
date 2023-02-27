import Database from '../util/database';
import { Employee } from '../model/employee';
import { Request, Response } from 'express';
import { User } from '../model/user';

export class EmployeeController {
  index = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('Requisicao sem corpo.');

    if (req.body.isLastAdmin) return this.isLastAdmin(req, res);

    await Database.instance.open();
    const users = await new User().find(req.body);
    await Database.instance.close();

    return res.json(users);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    const id = Number.parseInt(req.params.id);

    await Database.instance.open();
    const users = await new User().find({ id });
    await Database.instance.close();

    return res.json(users);
  };

  isLastAdmin = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const count = await new User().adminCount();
    await Database.instance.close();

    console.log(count);

    return res.json(count == 1);
  };

  desactivate = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    await Database.instance.open();
    await Database.instance.beginTransaction();
    const result = await new Employee().desactivate(Number.parseInt(req.params.id));
    if (result > 0) await Database.instance.commit();
    else {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('Erro ao desativar o funcionário.');
    }
    await Database.instance.close();

    return res.json('');
  };

  reactivate = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    await Database.instance.open();
    await Database.instance.beginTransaction();
    const result = await new Employee().reactivate(Number.parseInt(req.params.id));
    if (result > 0) await Database.instance.commit();
    else {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('Erro ao reativar o funcionário.');
    }
    await Database.instance.close();

    return res.json('');
  };
}
