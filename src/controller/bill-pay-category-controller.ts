import { Request, Response } from 'express';
import Database from '../util/database';
import { BillPayCategory } from '../model/bill-pay-category';

export class BillPayCategoryController {
  responseBuild = (bpc: BillPayCategory): any => {
    return {
      id: bpc.getId(),
      description: bpc.getDescription(),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const bpcs = await new BillPayCategory().find(req.body);
    const response = [];
    for (const bpc of bpcs) {
      response.push(this.responseBuild(bpc));
    }
    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro invalido');
    }
    await Database.instance.open();
    const bpc = await new BillPayCategory().findOne(id);
    const response = !bpc ? undefined : this.responseBuild(bpc);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisição sem corpo');
    const category = req.body.category;
    await Database.instance.open();
    const response = await new BillPayCategory(0, category.description).save();
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10) return res.status(400).json('erro ao registrar a categoria');
      if (response == -5) return res.status(400).json('campos incorretos');
      if (response == -1)
        return res.status(400).json('erro ao conectar ao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisição sem corpo');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro invalido');
    }
    await Database.instance.open();
    const bpc = await new BillPayCategory().findOne(id);
    if (!bpc) {
      await Database.instance.close();
      return res.status(400).json('categoria inexistente');
    }
    await Database.instance.beginTransaction();
    const response = await bpc.update(req.body.category.description);
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10) return res.status(400).json('erro ao registrar a categoria');
      if (response == -5) return res.status(400).json('campos incorretos');
      if (response == -1)
        return res.status(400).json('erro ao conectar ao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro invalido');
    }
    await Database.instance.open();
    const bpc = await new BillPayCategory().findOne(id);
    if (!bpc) {
      await Database.instance.close();
      return res.status(400).json('categoria inexistente');
    }
    await Database.instance.beginTransaction();
    const response = await bpc.delete();
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10) return res.status(400).json('erro ao remover a categoria');
      if (response == -1)
        return res.status(400).json('erro ao conectar ao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
