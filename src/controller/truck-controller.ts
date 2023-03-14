import Database from '../util/database';
import { Request, Response } from 'express';
import { Truck } from '../model/truck';
import { TruckType } from '../model/truck-type';
import Proprietary from '../model/proprietary';
import { ProprietaryController } from './proprietary-controller';
import { TruckTypeController } from './truck-type-controller';

export class TruckController {
  responseBuilder = async (truck: Truck): Promise<any> => {
    const type = (await new TruckType().find({ id: truck.getTypeId() }))[0];
    const prop = (await new Proprietary().findOne(
      truck.getProprietaryId(),
    )) as Proprietary;

    return {
      id: truck.getId(),
      plate: truck.getPlate(),
      brand: truck.getBrand(),
      model: truck.getModel(),
      color: truck.getColor(),
      manufactureYear: truck.getManufactureYear(),
      modelYear: truck.getModelYear(),
      proprietary: await new ProprietaryController().responseBuild(prop),
      type: await new TruckTypeController().responseBuild(type),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const trucks = await new Truck().find(req.body);
    const response = [];

    for (const truck of trucks) {
      response.push(await this.responseBuilder(truck));
    }
    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido.');
    }

    await Database.instance.open();
    const truck = await new Truck().findOne(id);
    const response = !truck ? undefined : await this.responseBuilder(truck);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('resquisicao sem corpo.');

    const truck = req.body.truck;

    await Database.instance.open();
    await Database.instance.beginTransaction();

    const trk = await new Truck(
      0,
      truck.plate,
      truck.brand,
      truck.model,
      truck.color,
      truck.manufactureYear,
      truck.modelYear,
      truck.type,
      truck.proprietary,
    ).save();
    if (trk <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (trk == -10) return res.status(400).json('erro ao inserir o caminhao.');
      if (trk == -5) return res.status(400).json('campos invalidos no caminhao.');
      if (trk == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('resquisicao sem corpo.');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido.');
    }

    await Database.instance.open();

    const truck = await new Truck().findOne(id);
    if (!truck) {
      await Database.instance.close();
      return res.status(400).json('camanhao nao encontrado.');
    }

    await Database.instance.beginTransaction();

    const trk = await truck.update(req.body.truck);
    if (trk <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (trk == -10) return res.status(400).json('erro ao atualizar o caminhao.');
      if (trk == -5) return res.status(400).json('campos invalidos no caminhao.');
      if (trk == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido.');
    }

    await Database.instance.open();

    const truck = await new Truck().findOne(id);
    if (!truck) {
      await Database.instance.close();
      return res.status(400).json('camanhao nao encontrado.');
    }

    await Database.instance.beginTransaction();

    const trk = await truck.delete();
    if (trk <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (trk == -10) return res.status(400).json('erro ao remover o caminhao.');
      if (trk == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
