import { Request, Response } from 'express';
import Database from '../util/database';
import { Event } from '../model/event';
import { FreightOrder } from '../model/freight-order';
import { SalesOrder } from '../model/sales-order';
import { User } from '../model/user';
import { FreightOrderController } from './freight-order-controller';
import { SalesOrderController } from './sales-order-controller';
import { EmployeeController } from './employee-controller';

export class EventController {
  responseBuild = async (event: Event): Promise<any> => {
    let freight = await new FreightOrder().findOne(event.getFreightOrderId());
    if (event.getFreightOrderId() > 0 && !freight)
      freight = new FreightOrder(
        event.getFreightOrderId(),
        new Date(),
        'Pedido excluído.',
      );
    let sale = await new SalesOrder().findOne(event.getSalesOrderId());
    if (event.getSalesOrderId() > 0 && !sale)
      sale = new SalesOrder(event.getSalesOrderId(), new Date(), 'Pedido excluído.');
    const author = (await new User().find({ id: event.getUserId() }))[0];

    return {
      id: event.getId(),
      date: event.getDate(),
      time: event.getTime(),
      description: event.getDescription(),
      freightOrder: !freight
        ? undefined
        : await new FreightOrderController().responseBuild(freight),
      salesOrder: !sale
        ? undefined
        : await new SalesOrderController().responseBuild(sale),
      author: await new EmployeeController().responseBuild(undefined, author),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const events = await new Event().find();
    const response = [];
    for (const event of events) {
      response.push(await this.responseBuild(event));
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
    const event = await new Event().findOne(id);
    const response = !event ? undefined : await this.responseBuild(event);
    await Database.instance.close();

    return res.json(response);
  };
}
