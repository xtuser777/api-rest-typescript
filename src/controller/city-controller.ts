import { Request, Response } from 'express';
import { City } from '../model/city';
import { State } from '../model/state';
import Database from '../util/database';

export class CityController {
  get = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const cities = await new City().find();
    await Database.instance.close();

    return res.json(cities);
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente.');

    await Database.instance.open();
    const city = (await new City().find({ id: Number.parseInt(req.params.id) }))[0];
    await Database.instance.close();

    return res.json(city);
  };

  getState = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente.');

    await Database.instance.open();
    const city = (await new City().find({ id: Number.parseInt(req.params.id) }))[0];
    const state = (await new State().find({ id: city.getStateId() }))[0];
    await Database.instance.close();

    return res.json(state);
  };

  getByState = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.state) return res.status(400).json('Parametro ausente.');

    await Database.instance.open();
    const cities = await new City().find({ state: Number.parseInt(req.params.state) });
    await Database.instance.close();

    return res.json(cities);
  };

  getByName = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.name) return res.status(400).json('Parametro ausente.');

    await Database.instance.open();
    const cities = await new City().find({ name: req.params.name });
    await Database.instance.close();

    return res.json(cities);
  };

  getByStateName = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.name || !req.params.state)
      return res.status(400).json('Parametro ausente.');

    await Database.instance.open();
    const cities = await new City().find({
      state: Number.parseInt(req.params.state),
      name: req.params.name,
    });
    await Database.instance.close();

    return res.json(cities);
  };
}
