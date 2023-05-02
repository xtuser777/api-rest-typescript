import { Request, Response } from 'express';
import Database from '../util/database';
import { Status } from '../model/status';
import { OrderStatus } from '../model/order-status';
import { User } from '../model/user';
import { StatusController } from './status-controller';
import { EmployeeController } from './employee-controller';
import { FreightOrder } from '../model/freight-order';
import { ActiveUser } from '../util/active-user';
import { Event } from '../model/event';

export class OrderStatusController {
  responseBuild = async (os: OrderStatus): Promise<any> => {
    const status = await new Status().findOne(os.getStatusId());
    const author = (await new User().find({ id: os.getUserId() }))[0];

    return {
      status: !status ? undefined : new StatusController().responseBuild(status),
      date: os.getDate(),
      time: os.getTime(),
      observation: os.getObservation(),
      current: os.getCurrent(),
      author: !author
        ? undefined
        : await new EmployeeController().responseBuild(undefined, author),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const oses = await new OrderStatus().find(req.body);
    const response = [];
    for (const os of oses) {
      response.push(await this.responseBuild(os));
    }
    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.prev) return await this.previous(req, res);
    if (!req.params.status || !req.params.order)
      return res.status(400).json('parametro ausente');
    let status = 0;
    let order = 0;
    try {
      status = Number.parseInt(req.params.status);
      order = Number.parseInt(req.params.order);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const os = await new OrderStatus().findOne(status, order);
    const response = !os ? undefined : await this.responseBuild(os);
    await Database.instance.close();

    return res.json(response);
  };

  previous = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.order) return res.status(400).json('parametro ausente');
    let order = 0;
    try {
      order = Number.parseInt(req.params.order);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const oses = await new OrderStatus().find({ order });
    const os = oses[oses.length - 2];
    const response = !os ? undefined : await this.responseBuild(os);
    await Database.instance.close();

    return res.json(response);
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.order) return res.status(400).json('parametro ausente');
    let orderId = 0;
    try {
      orderId = Number.parseInt(req.params.order);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo');
    const status = req.body.status;
    await Database.instance.open();
    const order = (await new FreightOrder().findOne(orderId)) as FreightOrder;
    const prev = (await new OrderStatus().findOne(
      order.getStatusId(),
      orderId,
    )) as OrderStatus;
    const sts = (await new Status().findOne(status.statusId)) as Status;
    const activeUser = ActiveUser.getInstance() as ActiveUser;
    await Database.instance.beginTransaction();
    const response = await new OrderStatus(
      status.statusId,
      status.date,
      new Date(),
      status.obsertation,
      true,
      activeUser.getId(),
    ).save(orderId);
    if (response < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10)
        return res.status(400).json('erro ao registrar o vínculo com o status');
      if (response == -5) return res.status(400).json('campos incorretos');
      if (response == -1)
        return res.status(400).json('erro de conexão ao banco de dados.');
    }
    prev.uncurrent(orderId, prev.getStatusId());
    const desc = sts.getDescription();
    const responseEvent = await new Event(
      0,
      `Alteração do status do pedido ${orderId} para ${desc}.`,
      new Date().toISOString().substring(0, 10),
      new Date().toISOString().split('T')[1].substring(0, 8),
      0,
      orderId,
      activeUser.getId(),
    ).save();
    if (responseEvent <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseEvent == -10) return res.status(400).json('erro ao registrar o evento');
      if (responseEvent == -5) return res.status(400).json('campos incorretos');
      if (responseEvent == -1)
        return res.status(400).json('erro de conexão ao banco de dados.');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
