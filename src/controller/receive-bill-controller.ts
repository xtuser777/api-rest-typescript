import { Request, Response } from 'express';
import Database from '../util/database';
import { PaymentForm } from '../model/payment-form';
import { FreightOrder } from '../model/freight-order';
import { SalesOrder } from '../model/sales-order';
import { User } from '../model/user';
import { PaymentFormController } from './payment-form-controller';
import { EmployeeController } from './employee-controller';
import { FreightOrderController } from './freight-order-controller';
import { SalesOrderController } from './sales-order-controller';
import { ActiveUser } from '../util/active-user';
import { Event } from '../model/event';
import { ReceiveBill } from '../model/receive-bill';
import { Representation } from '../model/representation';
import { RepresentationController } from './representation-controller';

export class ReceiveBillController {
  responseBuild = async (bill: ReceiveBill): Promise<any> => {
    const pendency = await new ReceiveBill().findOne(bill.getPendencyId());
    const form = await new PaymentForm().findOne(bill.getPaymentFormId());
    const representation = await new Representation().findOne(bill.getRepresentationId());
    const freight = await new FreightOrder().findOne(bill.getFreightOrderId());
    const sales = await new SalesOrder().findOne(bill.getSalesOrderId());
    const author = (await new User().find({ id: bill.getUserId() }))[0];

    return {
      id: bill.getId(),
      date: bill.getDate(),
      bill: bill.getBill(),
      description: bill.getDescription(),
      payer: bill.getPayer(),
      amount: bill.getAmount(),
      comission: bill.getComission(),
      situation: bill.getSituation(),
      dueDate: bill.getDueDate(),
      paymentDate: bill.getReceiveDate(),
      amountPaid: bill.getAmountReceived(),
      pendency: !pendency
        ? undefined
        : await new ReceiveBillController().responseBuild(pendency),
      paymentForm: !form ? undefined : new PaymentFormController().responseBuild(form),
      representation: !representation
        ? undefined
        : await new RepresentationController().responseBuild(representation),
      freightOrder: !freight
        ? undefined
        : await new FreightOrderController().responseBuild(freight),
      salesOrder: !sales
        ? undefined
        : await new SalesOrderController().responseBuild(sales),
      author: await new EmployeeController().responseBuild(undefined, author),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.bill) return await this.newBill(req, res);
    await Database.instance.open();
    const bills = await new ReceiveBill().find(req.body);
    const response = [];
    for (const bill of bills) {
      response.push(await this.responseBuild(bill));
    }
    await Database.instance.close();

    return res.json(response);
  };

  newBill = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const response = await new ReceiveBill().getNewBill();
    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro invalido');
    }
    await Database.instance.open();
    const bill = await new ReceiveBill().findOne(id);
    const response = !bill ? undefined : await this.responseBuild(bill);
    await Database.instance.close();

    return res.json(response);
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.receive) return await this.receive(req, res);
    if (req.body.reversal) return await this.reversal(req, res);

    return res.json('função não especificada no corpo da requisição.');
  };

  private receive = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisição sem corpo');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro invalido');
    }
    const receive = req.body.receive;
    await Database.instance.open();
    const bill = await new ReceiveBill().findOne(id);
    if (!bill) {
      await Database.instance.close();
      return res.status(400).json('conta inexistente');
    }
    await Database.instance.beginTransaction();
    let situation = 0;
    let rest = 0.0;
    if (receive.amount < bill.getAmount()) {
      situation = 2;
      rest = bill.getAmount() - receive.amount;
    } else situation = 3;
    let responsePendency = 0;
    if (situation == 2) {
      responsePendency = await new ReceiveBill(
        0,
        bill.getDate(),
        bill.getBill(),
        bill.getDescription(),
        bill.getPayer(),
        rest,
        false,
        1,
        bill.getDueDate(),
        undefined,
        0.0,
        0,
        0,
        0,
        0,
        bill.getFreightOrderId(),
        bill.getUserId(),
      ).save();
      if (responsePendency <= 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (responsePendency == -10)
          return res
            .status(400)
            .json('Problema ao salvar a pendência da despesa no banco de dados');
        if (responsePendency == -5) return res.status(400).json('campos incorretos');
        if (responsePendency == -1)
          return res.status(400).json('erro ao conectar ao banco de dados');
      }
    }
    const response = await bill.receive(
      receive.form,
      receive.amount,
      receive.date,
      situation,
      responsePendency,
    );
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10) return res.status(400).json('erro ao receber a conta a pagar');
      if (response == -5) return res.status(400).json('campos incorretos');
      if (response == -1)
        return res.status(400).json('erro ao conectar ao banco de dados');
    }
    const resposneEvent = await this.createEvent(bill, 1);
    if (resposneEvent <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (resposneEvent == -10) return res.status(400).json('erro ao registrar o evento');
      if (resposneEvent == -5) return res.status(400).json('campos incorretos no evento');
      if (resposneEvent == -1)
        return res.status(400).json('erro ao conectar ao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  private reversal = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisição sem corpo');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro invalido');
    }
    await Database.instance.open();
    const bill = await new ReceiveBill().findOne(id);
    if (!bill) {
      await Database.instance.close();
      return res.status(400).json('conta inexistente');
    }
    if (bill.getSituation() == 1) {
      await Database.instance.close();
      return res.status(400).json('Esta conta ainda não foi recebida...');
    }
    const pend = await new ReceiveBill().findOne(bill.getPendencyId());
    if (pend && pend.getSituation() > 1) {
      await Database.instance.close();
      return res
        .status(400)
        .json('Esta conta possui pendências recebidas... Estorne-as primeiro.');
    }
    await Database.instance.beginTransaction();
    const response = await bill.reversal();
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10)
        return res.status(400).json('erro ao estornar a conta a receber');
      if (response == -5) return res.status(400).json('campos incorretos');
      if (response == -1)
        return res.status(400).json('erro ao conectar ao banco de dados');
    }
    if (pend) {
      const responsePendency = await pend.delete();
      if (responsePendency <= 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (responsePendency == -10)
          return res.status(400).json('Problema ao remover a pendência da conta');
        if (responsePendency == -5) return res.status(400).json('campos incorretos');
        if (responsePendency == -1)
          return res.status(400).json('erro ao conectar ao banco de dados');
      }
    }
    const responseEvent = await this.createEvent(bill, 2);
    if (responseEvent <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (responseEvent == -10) return res.status(400).json('erro ao registrar o evento');
      if (responseEvent == -5) return res.status(400).json('campos incorretos no evento');
      if (responseEvent == -1)
        return res.status(400).json('erro ao conectar ao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  private createEvent = async (bill: ReceiveBill, method: number): Promise<number> => {
    if (bill.getId() <= 0) return -5;
    const activeUser = ActiveUser.getInstance() as ActiveUser;
    let description = '';
    if (method == 1) {
      description = `A conta a receber "${bill.getDescription()}" foi recebida.`;
    }
    if (method == 2) {
      description = `A conta a receber "${bill.getDescription()}" foi estornada.`;
    }

    return await new Event(
      0,
      description,
      new Date().toISOString().substring(0, 10),
      new Date().toISOString().split('T')[1].substring(0, 8),
      bill.getSalesOrderId(),
      bill.getFreightOrderId(),
      activeUser.getId(),
    ).save();
  };
}
