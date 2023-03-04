import Database from '../util/database';
import { TruckType } from '../model/truck-type';
import { Request, Response } from 'express';

export class TruckTypeController {
  responseBuild = (type: TruckType): any => {
    return {
      id: type.getId(),
      description: type.getDescription(),
      capacity: type.getCapacity(),
      axes: type.getAxes(),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('Requisicao sem corpo.');

    await Database.instance.open();
    const types = await new TruckType().find(req.body);

    const response = [];

    for (const type of types) {
      response.push(this.responseBuild(type));
    }

    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    const id = Number.parseInt(req.params.id);

    await Database.instance.open();

    const type = (await new TruckType().find({ id }))[0];

    const response = type ? this.responseBuild(type) : null;

    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('requisicao sem corpo.');

    const type = req.body.type;

    await Database.instance.open();
    await Database.instance.beginTransaction();

    const tt = await new TruckType(0, type.description, type.axes, type.capacity).save();
    if (tt <= 0) {
      if (tt == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao inserir o tipo de caminhao.');
      }
      if (tt == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos no tipo de caminhao.');
      }
      if (tt == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('requisicao sem corpo.');

    if (!req.params.id) return res.status(400).json('Parametro ausente');

    let id = 0;

    try {
      id = Number.parseInt(req.params.id);
    } catch (e) {
      return res.status(400).json('Parametro inválido');
    }

    await Database.instance.open();

    const type = (await new TruckType().find({ id }))[0];
    if (!type) {
      await Database.instance.close();
      return res.status(400).json('Tipo nao existe.');
    }

    await Database.instance.beginTransaction();

    const tt = await type.update(req.body.type);
    if (tt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (tt == -5) return res.status(400).json('campos incorretos no tipo de caminhao.');
      if (tt == -10)
        return res.status(400).json('erro na atualizacao do tipo de caminhao.');
      if (tt == -1)
        return res.status(400).json('erro ao abrir a conexao com o banco de dados.');
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
    } catch (e) {
      return res.status(400).json('Parametro inválido');
    }

    await Database.instance.open();

    const type = (await new TruckType().find({ id }))[0];

    if (!type) {
      await Database.instance.close();
      return res.status(400).json('Tipo nao existe.');
    }

    const dep = await type.dependents();
    if (dep > 0) {
      await Database.instance.close();
      return res.status(400).json('Este tipo possui dependents.');
    }

    await Database.instance.beginTransaction();

    const tt = await type.delete();
    if (tt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (tt == -10) return res.status(400).json('Erro ao remover o tipo de caminhão.');
      if (tt == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
