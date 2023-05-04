import Database from '../util/database';
import { State } from '../model/state';
import { Request, Response } from 'express';

export class StateController {
  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const states = await new State().find();
    await Database.instance.close();
    return res.json(states);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.json('parametro ausente');
    await Database.instance.open();
    const state = (await new State().find({ id: Number.parseInt(req.params.id) }))[0];
    await Database.instance.close();
    return res.json(state);
  };
}
