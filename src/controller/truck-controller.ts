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
    const response = !truck ? undefined : this.responseBuilder(truck);
    await Database.instance.close();

    return res.json(response);
  };
}
