import Database from '../util/database';
import { Level } from '../model/level';
import { Request, Response } from 'express';

export class LevelController {
  get = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const levels = await new Level().find();
    await Database.instance.close();

    return res.json(levels);
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    await Database.instance.open();
    const level = (await new Level().find({ id: Number.parseInt(req.params.id) }))[0];
    await Database.instance.close();

    return res.json(level);
  };
}
