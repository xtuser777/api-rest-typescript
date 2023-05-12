import Database from '../util/database';
import { State } from '../model/state';
import { Request, Response } from 'express';
import { City } from '../model/city';
import { CityController } from './city-controller';

export class StateController {
  responseBuild = async (state: State): Promise<any> => {
    const cities = await new City().find({ state: state.getId() });
    const responseCities = [];
    for (const city of cities) {
      responseCities.push(new CityController().responseBuild(city));
    }

    return {
      id: state.getId(),
      name: state.getName(),
      acronym: state.getAcronym(),
      cities: responseCities,
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const states = await new State().find();
    const response = [];
    for (const state of states) response.push(await this.responseBuild(state));
    await Database.instance.close();
    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.json('parametro ausente');
    await Database.instance.open();
    const state = (await new State().find({ id: Number.parseInt(req.params.id) }))[0];
    await Database.instance.close();
    return res.json(state);
  };
}
