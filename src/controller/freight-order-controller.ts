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
import { IndividualPerson } from '../model/individual-person';
import { BillPay } from '../model/bill-pay';
import { EnterprisePerson } from '../model/enterprise-person';
import { ReceiveBill } from '../model/receive-bill';
import { Event } from '../model/event';
import { Product } from '../model/product';
import { ProductController } from './product-controller';

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

  responseBuildItem = async (item: FreightOrderItem): Promise<any> => {
    const product = await new Product().findOne(item.getProductId());

    return {
      product: !product
        ? undefined
        : await new ProductController().responseBuild(product),
      quantity: item.getQuantity(),
      weight: item.getWeight(),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.floor) return this.minimumFloor(req, res);
    if (req.body.items) return await this.indexItems(req, res);
    await Database.instance.open();
    const orders = await new FreightOrder().find(req.body);
    const response = [];
    for (const order of orders) {
      response.push(await this.responseBuild(order));
    }
    await Database.instance.close();

    return res.json(response);
  };

  indexItems = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const items = await new FreightOrderItem().find(req.body.items);
    const response = [];
    for (const item of items) {
      response.push(await this.responseBuildItem(item));
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
    if (req.body.item) return await this.showItem(req, res);
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

  showItem = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente');
    let id = 0;
    let product = 0;
    try {
      id = Number.parseInt(req.params.id);
      product = Number.parseInt(req.body.item);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const item = await new FreightOrderItem().findOne(id, product);
    const response = !item ? undefined : await this.responseBuildItem(item);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo');
    const order = req.body.order;
    const items = req.body.items;
    const steps = req.body.steps;
    const activeUser = ActiveUser.getInstance() as ActiveUser;
    await Database.instance.open();
    await Database.instance.beginTransaction();
    const response = await new FreightOrder(
      0,
      order.date,
      order.description,
      order.distance,
      order.weight,
      order.value,
      order.amountDriver,
      order.amountDriverEntry,
      order.shipping,
      order.budget,
      order.sale,
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
      activeUser.getId(),
    ).save();
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10) return res.status(400).json('erro ao inserir o pedido');
      if (response == -5) return res.status(400).json('compos incorretos no pedido');
      if (response == -1) return res.status(400).json('erro conexao banco de dados');
    }
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
    const responseProprietaryBill = await this.releaseProprietaryBill(
      response,
      order.driver,
      order.paymentFormDriver,
      order.amountDriver,
      order.amountDriverEntry,
    );
    if (responseProprietaryBill < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseProprietaryBill == -10)
        return res.status(400).json('erro ao inserir a conta do proprietátio');
      if (responseProprietaryBill == -5)
        return res.status(400).json('compos incorretos na conta do proprietátio');
      if (responseProprietaryBill == -1)
        return res.status(400).json('erro conexao banco de dados');
    }
    const responseOrderBill = await this.releaseOrderBill(
      response,
      order.budget,
      order.sale,
      order.representation,
      order.paymentFormFreight,
      order.value,
    );
    if (responseOrderBill < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseOrderBill == -10)
        return res.status(400).json('erro ao inserir a conta do pedido');
      if (responseOrderBill == -5)
        return res.status(400).json('compos incorretos na conta do pedido');
      if (responseOrderBill == -1)
        return res.status(400).json('erro conexao banco de dados');
    }
    const responseEvent = await this.createEvent(response, order.description, 1);
    if (responseEvent < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseEvent == -10) return res.status(400).json('erro ao inserir o evento');
      if (responseEvent == -5) return res.status(400).json('compos incorretos no evento');
      if (responseEvent == -1) return res.status(400).json('erro conexao banco de dados');
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

  releaseProprietaryBill = async (
    order: number,
    driver: number,
    form: number,
    amount: number,
    adiantament: number,
  ): Promise<number> => {
    if (order <= 0 || driver <= 0 || amount <= 0) return -5;

    let situation = 1;
    let pendente = 0.0;

    if (adiantament > 0) {
      pendente = amount - adiantament;
      situation = 2;
    }

    const d = (await new Driver().findOne(driver)) as Driver;
    const p = (
      await new IndividualPerson().find({ id: d.getPersonId() })
    )[0] as IndividualPerson;

    const drv = p.getName();

    const activeUser = ActiveUser.getInstance() as ActiveUser;

    const bill = await new BillPay(
      0,
      await new BillPay().getNewBill(),
      new Date(),
      1,
      `Pagamento ao motorista ${drv}`,
      drv,
      1,
      amount,
      false,
      1,
      new Date(new Date().setMonth(new Date().getMonth() + 2)),
      undefined,
      0.0,
      0,
      0,
      driver,
      0,
      249,
      order,
      0,
      activeUser.getId(),
    );

    let response = await bill.save();

    if (response < 0) return response;

    if (pendente > 0) {
      response = await new BillPay(
        0,
        await new BillPay().getNewBill(),
        new Date(),
        1,
        `Pagamento ao motorista ${drv} (Pendência).`,
        drv,
        1,
        pendente,
        false,
        1,
        new Date(new Date().setMonth(new Date().getMonth() + 2)),
        undefined,
        0.0,
        0,
        0,
        driver,
        0,
        249,
        order,
        0,
        activeUser.getId(),
      ).save();

      if (response < 0) return response;

      response = await bill.payOff(
        form,
        adiantament,
        new Date().toISOString().substring(0, 10),
        situation,
        response,
      );
    }

    return response;
  };

  releaseOrderBill = async (
    order: number,
    budget: number,
    sale: number,
    representation: number,
    form: number,
    amount: number,
  ): Promise<number> => {
    if (order <= 0 || form <= 0 || amount <= 0) return -5;
    let payer = '';
    if (budget > 0) {
      const b = await new FreightBudget().findOne(budget);
      payer = !b ? '' : b.getDescription();
    } else if (sale > 0) {
      const s = await new SalesOrder().findOne(sale);
      payer = !s ? '' : s.getDescription();
    } else if (representation > 0) {
      const r = (await new Representation().findOne(representation)) as Representation;
      const p = (
        await new EnterprisePerson().find({ id: r.getPersonId() })
      )[0] as EnterprisePerson;
      payer = p.getFantasyName();
    }
    const activeUser = ActiveUser.getInstance() as ActiveUser;
    const bill = new ReceiveBill(
      0,
      new Date(),
      await new ReceiveBill().getNewBill(),
      `Recebimento pedido: ${order}`,
      payer,
      amount,
      false,
      1,
      new Date(new Date().setMonth(new Date().getDay() + 2)),
      undefined,
      0.0,
      0,
      0,
      budget > 0 ? representation : 0,
      0,
      order,
      activeUser.getId(),
    );

    const response = await bill.save();
    if (response <= 0) return response;

    const responseReceive = bill.receive(
      form,
      amount,
      new Date().toISOString().substring(0, 10),
      3,
      0,
    );

    return response;
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const order = await new FreightOrder().findOne(id);
    if (!order) {
      await Database.instance.close();
      return res.status(400).json('pedido ausente');
    }
    const activeUser = ActiveUser.getInstance() as ActiveUser;
    await Database.instance.beginTransaction();
    if (!(await this.deleteSteps(id)))
      return res.status(400).json('Erro ao excluir as etapas de carregamento do pedido.');
    if (!(await this.deleteItems(id)))
      return res.status(400).json('Erro ao excluir os itens do pedido.');
    if (!(await this.deleteStatus(id)))
      return res.status(400).json('Erro ao excluir os status do frete.');
    if (!(await this.deleteOrderBill(id)))
      return res.status(400).json('Erro ao excluir a conta a receber do pedido.');
    const responseProprietaryBill = await this.deleteProprietaryBill(id);
    if (responseProprietaryBill <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseProprietaryBill == -15)
        return res
          .status(400)
          .json(
            'A conta a pagar do proprietário está paga ou parcialmente paga, estorne esta antes de excluir.',
          );
      if (responseProprietaryBill == -10)
        return res
          .status(400)
          .json('Ocorreu um problema ao excluir a conta a pagar do proprietário.');
      if (responseProprietaryBill == -5)
        return res.status(400).json('Parametros invalidos.');
      if (responseProprietaryBill == -1)
        return res.status(400).json('Erro ao conectar ao banco de dados');
    }
    const response = await order.delete();
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10) return res.status(400).json('erro ao remover o pedido');
      if (response == -5) return res.status(400).json('compos incorretos no pedido');
      if (response == -1) return res.status(400).json('erro conexao banco de dados');
    }
    const responseEvent = await this.createEvent(id, order.getDescription(), 2);
    if (responseEvent <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseEvent == -10) return res.status(400).json('erro ao criar o evento');
      if (responseEvent == -5) return res.status(400).json('compos incorretos no evento');
      if (responseEvent == -1) return res.status(400).json('erro conexao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  deleteItems = async (order: number): Promise<boolean> => {
    if (order <= 0) return false;
    const items = await new FreightOrderItem().find({ order });
    if (items.length <= 0) return true;
    for (const item of items) {
      const r = await item.delete(order, item.getProductId());
      if (r < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        return false;
      }
    }

    return true;
  };

  deleteSteps = async (order: number): Promise<boolean> => {
    if (order <= 0) return false;
    const steps = await new LoadStep().find({ order });
    if (steps.length <= 0) return true;
    for (const step of steps) {
      const r = await step.delete();
      if (r < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        return false;
      }
    }

    return true;
  };

  deleteStatus = async (order: number): Promise<boolean> => {
    if (order <= 0) return false;
    const statuses = await new OrderStatus().find({ order });
    if (statuses.length == 0) return true;
    for (const status of statuses) {
      const r = await status.delete(order);
      if (r < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        return false;
      }
    }

    return true;
  };

  deleteProprietaryBill = async (order: number): Promise<number> => {
    if (order <= 0) return -5;
    const bills = await new BillPay().find({ freight: order });
    const bill = bills[0];
    if (!bill) return -10;
    if (bill.getSituation() > 1) return -15;

    return await bill.delete();
  };

  deleteOrderBill = async (order: number): Promise<boolean> => {
    if (order <= 0) return false;
    const bill = (await new ReceiveBill().find({ freight: order }))[0];
    if (!bill) return true;
    const r = await bill.delete();
    if (r < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      return false;
    }

    return true;
  };

  createEvent = async (
    order: number,
    orderDescription: string,
    method: number,
  ): Promise<number> => {
    if (order <= 0) return -5;
    const activeUser = ActiveUser.getInstance() as ActiveUser;

    return await new Event(
      0,
      method == 1
        ? `Abertura do pedido de frete ${order}: ${orderDescription}`
        : `Exclusão do pedido de frete ${order}: ${orderDescription}`,
      new Date(),
      new Date(),
      0,
      order,
      activeUser.getId(),
    ).save();
  };
}
