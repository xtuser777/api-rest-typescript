import { Request, Response } from 'express';
import { BillPay } from '../model/bill-pay';
import { City } from '../model/city';
import { Client } from '../model/client';
import { Employee } from '../model/employee';
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
import { Event } from '../model/event';
import { FreightOrder } from '../model/freight-order';
import { EnterprisePerson } from '../model/enterprise-person';
import { Product } from '../model/product';
import { ProductController } from './product-controller';
import { ActiveUser } from '../util/active-user';

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

  responseBuildItem = async (item: SalesOrderItem): Promise<any> => {
    const p = await new Product().findOne(item.getProductId());

    return {
      product: !p ? undefined : await new ProductController().responseBuild(p),
      quantity: item.getQuantity(),
      weight: item.getWeight(),
      price: item.getPrice(),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.items) return await this.indexItems(req, res);
    await Database.instance.open();
    const orders = await new SalesOrder().find(req.body);
    const response = [];
    for (const order of orders) {
      response.push(await this.responseBuild(order));
    }
    await Database.instance.close();

    return res.json(response);
  };

  indexItems = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const items = await new SalesOrderItem().find(req.body.items);
    const response = [];
    for (const item of items) {
      response.push(await this.responseBuildItem(item));
    }
    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.item) return await this.showItem(req, res);
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

  showItem = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');
    let id = 0;
    let product = 0;
    try {
      id = Number.parseInt(req.params.id);
      product = Number.parseInt(req.body.item);
    } catch {
      return res.status(400).json('parametro invalido.');
    }
    await Database.instance.open();
    const item = await new SalesOrderItem().findOne(id, product);
    const response = !item ? undefined : await this.responseBuildItem(item);
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
      0,
      order.date,
      order.description,
      order.weight,
      order.value,
      order.salesman,
      order.destiny,
      order.budget,
      order.truckType,
      order.client,
      order.paymentForm,
      order.author,
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
        item.product,
        item.quantity,
        item.price,
        item.weight,
      ).save(ord);
      if (itm < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (itm == -10) return res.status(400).json('erro ao inserir o item');
        if (itm == -5) return res.status(400).json('campos incorretos no item');
        if (itm == -1) return res.status(400).json('erro de conexao no banco');
      }
    }
    const responseBill = await this.releaseBill(
      ord,
      order.salesman,
      order.paymentForm,
      order.client,
      order.author,
      order.value,
      order.value,
      order.salesmanComissionPorcent,
      order.comissions,
    );
    if (responseBill <= 0) {
      await Database.instance.beginTransaction();
      await Database.instance.close();
      if (responseBill == -10) return res.status(400).json('erro ao lancar as contas');
      if (responseBill == -5) return res.status(400).json('campos incorretos nas contas');
      if (responseBill == -1) return res.status(400).json('erro ao conectar ao banco');
    }
    const responseEvent = await this.createEvent(ord, order.description, 1);
    if (responseEvent <= 0) {
      await Database.instance.beginTransaction();
      await Database.instance.close();
      if (responseEvent == -10) return res.status(400).json('erro ao lancar o evento');
      if (responseEvent == -5) return res.status(400).json('campos incorretos no evento');
      if (responseEvent == -1) return res.status(400).json('erro ao conectar ao banco');
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
    const cli = await new Client().findOne(client);
    const individual =
      cli?.getType() == 1
        ? ((
            await new IndividualPerson().find({ id: cli.getPersonId() })
          )[0] as IndividualPerson)
        : undefined;
    const enterprise =
      cli?.getType() == 2
        ? ((
            await new EnterprisePerson().find({ id: cli?.getPersonId() })
          )[0] as EnterprisePerson)
        : undefined;

    const bill = new ReceiveBill(
      0,
      new Date(),
      await new ReceiveBill().getNewBill(),
      `Recebimento pedido: ${order}`,
      cli?.getType() == 1 ? individual?.getName() : enterprise?.getFantasyName(),
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
      new Date().toISOString().substring(0, 10),
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

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido.');
    }
    await Database.instance.open();
    const order = await new SalesOrder().findOne(id);
    if (!order) {
      await Database.instance.close();
      return res.status(400).json('pedido inexistente.');
    }
    const freight = (await new FreightOrder().find({ price: id }))[0];
    if (freight)
      return res
        .status(400)
        .json(
          `Este orçamento está vinculado ao pedido de frete "${freight.getDescription()}"`,
        );
    await Database.instance.beginTransaction();
    const responseBills = await this.deleteBills(id, order.getEmployeeId());
    if (responseBills < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseBills == -15)
        return res
          .status(400)
          .json(
            'Não foi possível deletar uma comissao ou pendência que já tenha sido recebida.',
          );
      if (responseBills == -10)
        return res
          .status(400)
          .json(
            'Ocorreram problemas na exclusão das comissões do pedido ou algum registro não foi encontrado.',
          );
      if (responseBills == -5)
        return res.status(400).json('Algum parâmetro foi passado incorretamente.');
    }
    if (!(await this.deleteItems(id)))
      return res.status(400).json('Erro ao excluir os itens do pedido.');
    const responseOrder = await order.delete();
    if (responseOrder <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseOrder == -10) return res.status(400).json('erro ao remover o pedido.');
      if (responseOrder == -5) return res.status(400).json('campos inválidos pedido.');
      if (responseOrder == -1) return res.status(400).json('erro de conexao ao banco.');
    }
    const responseEvent = await this.createEvent(id, order.getDescription(), 2);
    if (responseEvent <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseEvent == -10) return res.status(400).json('erro ao criar o evento.');
      if (responseEvent == -5) return res.status(400).json('campos inválidos evento.');
      if (responseEvent == -1) return res.status(400).json('erro de conexao ao banco.');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  private deleteItems = async (order: number): Promise<boolean> => {
    const items = await new SalesOrderItem().find({ order });
    if (items.length == 0) return true;
    for (const item of items) {
      const response = await item.delete(order);
      console.log(response);

      if (response < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        return false;
      }
    }

    return true;
  };

  private deleteBills = async (order: number, salesman: number): Promise<number> => {
    let response = 0;
    if (order <= 0) return -5;
    const orderReceive = (await new ReceiveBill().find({ sale: order }))[0];
    if (!orderReceive) return -10;
    console.log(1);

    if (orderReceive.getPendencyId() > 0) {
      const pend = await new ReceiveBill().findOne(orderReceive.getPendencyId());
      if (pend) {
        if (pend.getAmountReceived() > 0) return -15;
        response = await pend.delete();
        if (response < 0) return response;
      }
    }
    response = await orderReceive.delete();
    if (response < 0) return response;
    console.log(2);

    if (salesman > 0) {
      const salesmanComission = (await new BillPay().find({ saleComissioned: order }))[0];
      if (!salesmanComission) return -10;
      if (salesmanComission.getSituation() > 1) return -15;
      response = await salesmanComission.delete();
      if (response < 0) return response;
    }
    const comissions = await new ReceiveBill().find({ sale: order });
    if (!comissions) return -10;
    for (const comission of comissions) {
      if (comission.getSituation() > 1) return -15;
      response = await comission.delete();
      if (response < 0) return response;
    }

    return response;
  };

  private createEvent = async (
    order: number,
    orderDescription: string,
    method: number,
  ): Promise<number> => {
    const activeUser = ActiveUser.getInstance() as ActiveUser;
    const user = activeUser.getId();
    console.log(order, orderDescription, user, method);

    if (order <= 0 || orderDescription.length == 0 || user <= 0) return -5;

    const response = await new Event(
      0,
      method == 1
        ? `Abertura do pedido de venda ${order}: ${orderDescription}`
        : `O pedido de venda ${order} foi deletado.`,
      new Date().toISOString().substring(0, 10),
      new Date().toISOString().split('T')[1].substring(0, 8),
      order,
      0,
      user,
    ).save();

    return response;
  };
}
