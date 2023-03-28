import { Request, Response } from 'express';
import { BillPay } from '../model/bill-pay';
import { City } from '../model/city';
import { Client } from '../model/client';
import { Employee } from '../model/employee';
import { FreightOrderItem } from '../model/freight-order-item';
import { IndividualPerson } from '../model/individual-person';
import { PaymentForm } from '../model/payment-form';
import { ReceiveBill } from '../model/receive-bill';
import { SaleBudget } from '../model/sale-budget';
import { SalesOrder } from '../model/sales-order';
import { SalesOrderItem } from '../model/sales-order-item';
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
    const ord = await new SalesOrder(
      order.ped_ved_id,
      order.ped_ven_data,
      order.ped_ven_descricao,
      order.ped_ven_peso,
      order.ped_ven_valor,
      order.fun_id,
      order.cid_id,
      order.orc_ven_id,
      order.tip_cam_id,
      order.cli_id,
      order.for_pag_id,
      order.usu_id,
    ).save();
    if (ord <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ord == -10) return res.status(400).json('erro ao inserir o pedido de venda');
      if (ord == -5) return res.status(400).json('campos incorretos no pedido');
      if (ord == -1) return res.status(400).json('erro de conexao no banco');
    }
    if (items.length == 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('sem itens no pedido de venda');
    }
    for (const item of items) {
      const itm = await new SalesOrderItem(
        item.pro_id,
        item.ped_ved_pro_quantidade,
        item.ped_ven_pro_valor,
        item.ped_ven_pro_peso,
      ).save(ord);
      if (itm < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (itm == -10) return res.status(400).json('erro ao inserir o item');
        if (itm == -5) return res.status(400).json('campos incorretos no item');
        if (itm == -1) return res.status(400).json('erro de conexao no banco');
      }
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  private releaseBill = async (
    order: number,
    salesman: number,
    form: number,
    client: number,
    author: number,
    amount: number,
    amountReceived: number,
    porcentComissionSalesman: number,
    comissions: any[],
  ): Promise<number> => {
    if (salesman > 0) {
      const salesmanComission = (amount / 100) * porcentComissionSalesman;
      const rsc = await this.salesmanComissionRelease(
        salesman,
        order,
        salesmanComission,
        author,
      );
      if (rsc <= 0) return rsc;
    }

    for (const comission of comissions) {
      const rc = await this.releaseComission(order, comission, author);
      if (rc) return rc;
    }

    const bill = new ReceiveBill(
      0,
      new Date(),
      await new ReceiveBill().getNewBill(),
      `Recebimento pedido: ${order}`,
      '',
      amount,
      false,
      1,
      new Date(new Date().setMonth(new Date().getMonth() + 1)),
      undefined,
      0.0,
      0,
      0,
      0,
      order,
      0,
      author,
    );

    const response = await bill.save();

    if (response <= 0) return response;
    else bill.setId(response);

    const responseReceive = await bill.receive(
      form,
      amountReceived,
      new Date().toISOString(),
      3,
      0,
    );

    return responseReceive;
  };

  private salesmanComissionRelease = async (
    salesman: number,
    order: number,
    amount: number,
    author: number,
  ): Promise<number> => {
    const e = (await new Employee().find({ id: salesman }))[0];
    const p = (
      await new IndividualPerson().find({ id: e.getPersonId() })
    )[0] as IndividualPerson;

    const response = await new BillPay(
      0,
      await new BillPay().getNewBill(),
      new Date(Date.now()),
      2,
      `Comissão vendedor: ${p.getName()}. Pedido: ${order}`,
      p.getName(),
      1,
      amount,
      true,
      1,
      new Date(new Date().setMonth(new Date().getMonth() + 2)),
      undefined,
      0.0,
      0,
      0,
      0,
      salesman,
      250,
      0,
      order,
      author,
    ).save();

    return response;
  };

  private releaseComission = async (
    order: number,
    comission: any,
    author: number,
  ): Promise<number> => {
    const value = (comission.value / 100) * comission.porcent;

    const response = await new ReceiveBill(
      0,
      new Date(),
      await new ReceiveBill().getNewBill(),
      `Recebimento comissão pedido: ${order}`,
      comission.representation.fantasyName,
      value,
      true,
      1,
      new Date(new Date().setMonth(new Date().getMonth() + 1)),
      undefined,
      0.0,
      0,
      0,
      comission.representation.id,
      order,
      0,
      author,
    ).save();

    return response;
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
