import { Request, Response } from 'express';
import { City } from '../model/city';
import { Client } from '../model/client';
import { Employee } from '../model/employee';
import { PaymentForm } from '../model/payment-form';
import { SaleBudget } from '../model/sale-budget';
import { SalesOrder } from '../model/sales-order';
import { TruckType } from '../model/truck-type';
import { User } from '../model/user';
import Database from '../util/database';
import { CityController } from './city-controller';
import { ClientController } from './client-controller';
import { EmployeeController } from './employee-controller';
import { PaymentFormController } from './payment-form-controller';
import { SaleBudgetController } from './sale-budget-controller';
import { TruckTypeController } from './truck-type-controller';

export class SalesOrderController {
  responseBuild = async (order: SalesOrder): Promise<any> => {
    const salesman = (await new Employee().find({ id: order.getEmployeeId() }))[0];
    const destiny = (await new City().find({ id: order.getCityId() }))[0];
    const budget = await new SaleBudget().findOne(order.getBudgetId());
    const type = (await new TruckType().find({ id: order.getTruckTypeId() }))[0];
    const client = await new Client().findOne(order.getClientId());
    const form = await new PaymentForm().findOne(order.getPaymentFormId());
    const author = (await new User().find({ id: order.getUserId() }))[0];

    return {
      id: order.getId(),
      data: order.getDate(),
      description: order.getDescription(),
      weight: order.getWeight(),
      value: order.getValue(),
      salesman: !salesman
        ? undefined
        : await new EmployeeController().responseBuild(salesman, undefined),
      destiny: !destiny ? undefined : await new CityController().responseBuild(destiny),
      budget: !budget
        ? undefined
        : await new SaleBudgetController().responseBuild(budget),
      truckType: !type ? undefined : await new TruckTypeController().responseBuild(type),
      client: !client ? undefined : await new ClientController().responseBuild(client),
      paymentForm: !form ? undefined : new PaymentFormController().responseBuild(form),
      author: !author
        ? undefined
        : await new EmployeeController().responseBuild(undefined, author),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const orders = await new SalesOrder().find(req.body);
    const response = [];
    for (const order of orders) {
      response.push(await this.responseBuild(order));
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
    const order = await new SalesOrder().findOne(id);
    const response = !order ? undefined : await this.responseBuild(order);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');
    const order = req.body.order;
    const items = req.body.items;
    await Database.instance.open();
    await Database.instance.beginTransaction();
    const ord = await new SalesOrder().save();
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido.');
    }
    await Database.instance.open();
    await Database.instance.beginTransaction();

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido.');
    }
    await Database.instance.open();
    await Database.instance.beginTransaction();

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
