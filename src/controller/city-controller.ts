import { Request, Response } from 'express';
import { City } from '../model/city';
import { State } from '../model/state';
import Database from '../util/database';

export class CityController {
  responseBuild = async (city: City): Promise<any> => {
    const state = (await new State().find({ id: city.getStateId() }))[0];

    return {
      id: city.getId(),
      name: city.getName(),
      state: {
        id: state.getId(),
        name: state.getName(),
        acronym: state.getAcronym(),
      },
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (req.params.function == 'show') return this.show(req, res);
    await Database.instance.open();
    const filters = JSON.parse(req.params.value);
    const cities = await new City().find(filters);

    const response = [];

    for (const city of cities) {
      response.push(await this.responseBuild(city));
    }

    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.value) return res.status(400).json('Parametro ausente.');

    await Database.instance.open();
    const city = (await new City().find({ id: Number.parseInt(req.params.value) }))[0];
    const response = await this.responseBuild(city);
    await Database.instance.close();

    return res.json(response);
  };
}
