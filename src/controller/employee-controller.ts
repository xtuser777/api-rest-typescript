import Database from '../util/database';
import { Employee } from '../model/employee';
import { Request, Response } from 'express';
import { User } from '../model/user';

export class EmployeeController {
  get = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const users = await new User().find();
    await Database.instance.close();

    return res.json(users);
  };

  getByFilter = async (req: Request, res: Response): Promise<Response> => {
    const filter = req.params.filter ? req.params.filter : '';

    await Database.instance.open();
    const users = await new User().find({
      login: filter,
      personName: filter,
      contactId: filter,
    });
    await Database.instance.close();

    return res.json(users);
  };

  getByAdmission = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.admission) return res.status(400).json('Parametro ausente');

    const admission = req.params.admission;

    await Database.instance.open();
    const users = await new User().find({ employeeAdmission: admission });
    await Database.instance.close();

    return res.json(users);
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
