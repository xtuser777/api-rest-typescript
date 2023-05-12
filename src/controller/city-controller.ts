import { Request, Response } from 'express';
import { City } from '../model/city';
import Database from '../util/database';

export class CityController {
  responseBuild = (city: City): any => {
    return {
      id: city.getId(),
      name: city.getName(),
      state: city.getStateId(),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const cities = await new City().find();

    const response = [];

    for (const city of cities) {
      response.push(this.responseBuild(city));
    }

    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente.');

    await Database.instance.open();
    const city = (await new City().find({ id: Number.parseInt(req.params.id) }))[0];
    const response = this.responseBuild(city);
    await Database.instance.close();

    return res.json(response);
  };
}
