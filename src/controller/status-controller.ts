import { Request, Response } from 'express';
import Database from '../util/database';
import { Status } from '../model/status';

export class StatusController {
  responseBuild = (status: Status): any => {
    return {
      id: status.getId(),
      description: status.getDescription(),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const statuses = await new Status().find(req.body);
    const response = [];
    for (const status of statuses) {
      response.push(this.responseBuild(status));
    }
    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const status = await new Status().findOne(id);
    const response = !status ? undefined : this.responseBuild(status);
    await Database.instance.close();

    return res.json(response);
  };
}
