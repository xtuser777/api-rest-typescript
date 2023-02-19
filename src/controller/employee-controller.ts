import Database from '../util/database';
import { Employee } from '../model/employee';
import { Request, Response } from 'express';

export class EmployeeController {
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
