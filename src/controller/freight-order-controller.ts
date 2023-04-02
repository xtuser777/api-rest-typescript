import { Request, Response } from 'express';
import Database from '../util/database';
import { FreightOrder } from '../model/freight-order';
import { FreightBudget } from '../model/freight-budget';
import { SalesOrder } from '../model/sales-order';
import { Representation } from '../model/representation';
import { Client } from '../model/client';
import { City } from '../model/city';
import { TruckType } from '../model/truck-type';
import Proprietary from '../model/proprietary';
import Driver from '../model/driver';
import { Truck } from '../model/truck';
import { Status } from '../model/status';
import { PaymentForm } from '../model/payment-form';
import { User } from '../model/user';
import { FreightBudgetController } from './freight-budget-controller';
import { SalesOrderController } from './sales-order-controller';
import { RepresentationController } from './representation-controller';
import { ClientController } from './client-controller';
import { CityController } from './city-controller';
import { TruckTypeController } from './truck-type-controller';
import { ProprietaryController } from './proprietary-controller';
import { DriverController } from './driver-controller';
import { TruckController } from './truck-controller';
import { PaymentFormController } from './payment-form-controller';
import { EmployeeController } from './employee-controller';
import { FreightOrderItem } from '../model/freight-order-item';
import { LoadStep } from '../model/load-step';
import { OrderStatus } from '../model/order-status';
import { ActiveUser } from '../util/active-user';

export class FreightOrderController {
  responseBuild = async (order: FreightOrder): Promise<any> => {
    const budget = await new FreightBudget().findOne(order.getBudgetId());
    const sale = await new SalesOrder().findOne(order.getSalesOrderId());
    const representation = await new Representation().findOne(
      order.getRespresentationId(),
    );
    const client = await new Client().findOne(order.getClientId());
    const destiny = (await new City().find({ id: order.getCityId() }))[0];
    const truckType = (await new TruckType().find({ id: order.getTruckTypeId() }))[0];
    const proprietary = await new Proprietary().findOne(order.getProprietaryId());
    const driver = await new Driver().findOne(order.getDriverId());
    const truck = await new Truck().findOne(order.getTruckId());
    const status = await new Status().findOne(order.getStatusId());
    const paymentFormFreight = await new PaymentForm().findOne(
      order.getPaymentFormFreightId(),
    );
    const paymentFormDriver = await new PaymentForm().findOne(
      order.getPaymentFormDriverId(),
    );
    const author = (await new User().find({ id: order.getUserId() }))[0];

    return {
      id: order.getId(),
      date: order.getDate(),
      description: order.getDescription(),
      distance: order.getDistance(),
      weight: order.getWeight(),
      value: order.getValue(),
      driverValue: order.getDriverValue(),
      driverEntry: order.getDriverEntry(),
      shipping: order.getShipping(),
      budget: !budget
        ? undefined
        : await new FreightBudgetController().responseBuild(budget),
      salesOrder: !sale
        ? undefined
        : await new SalesOrderController().responseBuild(sale),
      representation: !representation
        ? undefined
        : await new RepresentationController().responseBuild(representation),
      client: !client ? undefined : await new ClientController().responseBuild(client),
      destiny: !destiny ? undefined : await new CityController().responseBuild(destiny),
      truckType: !truckType
        ? undefined
        : new TruckTypeController().responseBuild(truckType),
      proprietary: !proprietary
        ? undefined
        : await new ProprietaryController().responseBuild(proprietary),
      driver: !driver ? undefined : await new DriverController().responseBuild(driver),
      truck: !truck ? undefined : await new TruckController().responseBuilder(truck),
      status: !status ? undefined : status,
      paymentFormFreight: !paymentFormFreight
        ? undefined
        : new PaymentFormController().responseBuild(paymentFormFreight),
      paymentFormDriver: !paymentFormDriver
        ? undefined
        : new PaymentFormController().responseBuild(paymentFormDriver),
      author: !author
        ? undefined
        : await new EmployeeController().responseBuild(undefined, author),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.floor) return this.minimumFloor(req, res);
    await Database.instance.open();
    const orders = await new FreightOrder().find(req.body);
    const response = [];
    for (const order of orders) {
      response.push(await this.responseBuild(order));
    }
    await Database.instance.close();

    return res.json(response);
  };

  minimumFloor = (req: Request, res: Response): Response => {
    let km = 0;
    let axes = 0;
    try {
      km = Number.parseInt(req.body.floor.km);
      axes = Number.parseInt(req.body.floor.axes);
    } catch {
      return res.status(400).json('parametros invalidos');
    }
    const floor = new FreightOrder().calculateMinimumFloor(km, axes);

    return res.json(floor);
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
    const order = await new FreightOrder().findOne(id);
    const response = !order ? undefined : await this.responseBuild(order);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo');
    const order = req.body.order;
    const items = req.body.items;
    const steps = req.body.steps;
    await Database.instance.open();
    await Database.instance.beginTransaction();
    const response = await new FreightOrder(
      0,
      order.date,
      order.description,
      order.distance,
      order.weight,
      order.value,
      order.driverAmount,
      order.driverAmountEntry,
      order.shipping,
      order.budget,
      order.sales,
      order.representation,
      order.client,
      order.destiny,
      order.truckType,
      order.proprietary,
      order.driver,
      order.truck,
      order.status,
      order.paymentFormFreight,
      order.paymentFormDriver,
      order.author,
    ).save();
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10) return res.status(400).json('erro ao inserir o pedido');
      if (response == -5) return res.status(400).json('compos incorretos no pedido');
      if (response == -1) return res.status(400).json('erro conexao banco de dados');
    }
    order.setId(response);
    if (items.length == 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('sem itens no pedido');
    }
    for (const item of items) {
      const responseItem = await new FreightOrderItem(
        item.product,
        item.quantity,
        item.weight,
      ).save(response);
      if (responseItem < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (responseItem == -10) return res.status(400).json('erro ao inserir o item');
        if (responseItem == -5) return res.status(400).json('compos incorretos no item');
        if (responseItem == -1)
          return res.status(400).json('erro conexao banco de dados');
      }
    }
    const responseSteps = await this.insertSteps(response, steps);
    if (responseSteps <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseSteps == -10)
        return res.status(400).json('erro ao inserir a etapa de carregamento');
      if (responseSteps == -5)
        return res.status(400).json('compos incorretos na etapa de carregamento');
      if (responseSteps == -1) return res.status(400).json('erro conexao banco de dados');
    }
    const responseStatus = await this.insertStatus(response);
    if (responseStatus < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseStatus == -10) return res.status(400).json('erro ao inserir o status');
      if (responseStatus == -5)
        return res.status(400).json('compos incorretos no status');
      if (responseStatus == -1)
        return res.status(400).json('erro conexao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  insertSteps = async (order: number, steps: any[]): Promise<number> => {
    if (order <= 0 || steps.length == 0) return -5;
    let response = 9999;
    for (let i = 0; i < steps.length && response > 0; i++) {
      response = await new LoadStep(
        0,
        steps[i].order,
        steps[i].status,
        steps[i].load,
        steps[i].representation.id,
      ).save(order);
    }

    return response;
  };

  insertStatus = async (order: number): Promise<number> => {
    if (order <= 0) return -5;
    const activeUser = ActiveUser.getInstance() as ActiveUser;
    return await new OrderStatus(
      1,
      new Date(),
      new Date(),
      '',
      true,
      activeUser.getId(),
    ).save(order);
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    return res.json('');
  };
}
