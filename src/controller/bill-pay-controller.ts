import { Request, Response } from 'express';
import Database from '../util/database';
import { BillPay } from '../model/bill-pay';
import { PaymentForm } from '../model/payment-form';
import Driver from '../model/driver';
import { Employee } from '../model/employee';
import { BillPayCategory } from '../model/bill-pay-category';
import { FreightOrder } from '../model/freight-order';
import { SalesOrder } from '../model/sales-order';
import { User } from '../model/user';
import { PaymentFormController } from './payment-form-controller';
import { DriverController } from './driver-controller';
import { EmployeeController } from './employee-controller';
import { BillPayCategoryController } from './bill-pay-category-controller';
import { FreightOrderController } from './freight-order-controller';
import { SalesOrderController } from './sales-order-controller';
import { ActiveUser } from '../util/active-user';
import { Event } from '../model/event';

export class BillPayController {
  responseBuild = async (bill: BillPay): Promise<any> => {
    const pendency = await new BillPay().findOne(bill.getPendencyId());
    const form = await new PaymentForm().findOne(bill.getPaymentFormId());
    const driver = await new Driver().findOne(bill.getDriverId());
    const salesman = (await new Employee().find({ id: bill.getEmployeeId() }))[0];
    const category = await new BillPayCategory().findOne(bill.getCategoryId());
    const freight = await new FreightOrder().findOne(bill.getFreightOrderId());
    const sales = await new SalesOrder().findOne(bill.getSalesOrderId());
    const author = (await new User().find({ id: bill.getUserId() }))[0];

    return {
      id: bill.getId(),
      bill: bill.getBill(),
      date: bill.getDate(),
      description: bill.getDescription(),
      enterprise: bill.getEntreprise(),
      type: bill.getType(),
      installment: bill.getInstallment(),
      amount: bill.getAmount(),
      comission: bill.getComission(),
      situation: bill.getSituation(),
      dueDate: bill.getDueDate(),
      paymentDate: bill.getPaymentDate(),
      amountPaid: bill.getAmountPaid(),
      pendency: !pendency
        ? undefined
        : await new BillPayController().responseBuild(pendency),
      paymentForm: !form ? undefined : new PaymentFormController().responseBuild(form),
      driver: !driver ? undefined : await new DriverController().responseBuild(driver),
      salesman: !salesman
        ? undefined
        : await new EmployeeController().responseBuild(salesman, undefined),
      category: !category
        ? undefined
        : new BillPayCategoryController().responseBuild(category),
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
    const bills = await new BillPay().find(req.body);
    const response = [];
    for (const bill of bills) {
      response.push(await this.responseBuild(bill));
    }
    await Database.instance.close();

    return res.json(response);
  };

  newBill = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const response = await new BillPay().getNewBill();
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
    const bill = await new BillPay().findOne(id);
    const response = !bill ? undefined : await this.responseBuild(bill);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisição sem corpo');
    const bill = req.body.bill;
    const activeUser = ActiveUser.getInstance() as ActiveUser;
    await Database.instance.open();
    await Database.instance.beginTransaction();
    const installmentAmount =
      bill.type == 2 ? bill.amount / bill.installments : bill.amount;
    const b = new BillPay(
      0,
      bill.bill,
      bill.date,
      bill.type,
      bill.description,
      bill.enterprise,
      1,
      installmentAmount,
      false,
      1,
      bill.dueDate,
      undefined,
      0.0,
      0,
      0,
      0,
      0,
      bill.category,
      bill.freight,
      0,
      activeUser.getId(),
    );
    let response = await b.save();
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10)
        return res.status(400).json('erro ao registrar a conta a pagar');
      if (response == -5) return res.status(400).json('campos incorretos');
      if (response == -1)
        return res.status(400).json('erro ao conectar ao banco de dados');
    }
    let situation = 3;
    let responsePendency = 0;
    if (bill.type == 1 && bill.amountPaid < bill.amount) {
      situation = 2;
      const pendAmount = bill.amount - bill.amountPaid;
      responsePendency = await new BillPay(
        0,
        bill.bill,
        bill.date,
        bill.type,
        bill.description,
        bill.enterprise,
        1,
        pendAmount,
        false,
        1,
        bill.dueDate,
        undefined,
        0.0,
        0,
        0,
        0,
        0,
        bill.category,
        bill.freight,
        0,
        activeUser.getId(),
      ).save();
      if (responsePendency <= 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (responsePendency == -10)
          return res.status(400).json('Problema ao salvar a pendência da despesa');
        if (responsePendency == -5) return res.status(400).json('campos incorretos');
        if (responsePendency == -1)
          return res.status(400).json('erro ao conectar ao banco de dados');
      }
    }
    if (bill.type == 1 && response > 0) {
      b.setId(response);
      const responsePay = await b.payOff(
        bill.form,
        bill.amountPaid,
        bill.dueDate,
        situation,
        responsePendency,
      );
      if (responsePay <= 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (responsePay == -10)
          return res.status(400).json('erro ao quitar a conta a pagar');
        if (responsePay == -5) return res.status(400).json('campos incorretos');
        if (responsePay == -1)
          return res.status(400).json('erro ao conectar ao banco de dados');
      }
    }
    for (let i = 1; 1 < bill.installments && response > 0; i++) {
      let date = new Date();
      if (bill.type == 2) {
        date = new Date(new Date().setDate(new Date().getDate() + bill.interval));
      } else {
        switch (bill.frequency) {
          case 1:
            date = new Date(new Date().setMonth(new Date().getMonth() + i));
            break;
          case 2:
            new Date(new Date().setFullYear(new Date().getFullYear() + i));
            break;
        }
      }
      response = await new BillPay(
        0,
        bill.bill,
        bill.date,
        bill.type,
        bill.description,
        bill.enterprise,
        i + 1,
        installmentAmount,
        false,
        1,
        date,
        undefined,
        0.0,
        0,
        0,
        0,
        0,
        bill.category,
        bill.freight,
        0,
        activeUser.getId(),
      ).save();
      if (response <= 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (response == -10)
          return res.status(400).json('erro ao registrar a parcela da conta a pagar');
        if (response == -5) return res.status(400).json('campos incorretos');
        if (response == -1)
          return res.status(400).json('erro ao conectar ao banco de dados');
      }
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.payoff) return await this.payOff(req, res);
    if (req.body.reversal) return await this.reversal(req, res);

    return res.json('função não especificada no corpo da requisição.');
  };

  private payOff = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisição sem corpo');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro invalido');
    }
    const payoff = req.body.payoff;
    await Database.instance.open();
    const bill = await new BillPay().findOne(id);
    if (!bill) {
      await Database.instance.close();
      return res.status(400).json('conta inexistente');
    }
    await Database.instance.beginTransaction();
    let situation = 0;
    let rest = 0.0;
    if (payoff.amount < bill.getAmount()) {
      situation = 2;
      rest = bill.getAmount() - payoff.amount;
    } else situation = 3;
    let responsePendency = 0;
    if (situation == 2) {
      responsePendency = await new BillPay(
        0,
        bill.getBill(),
        bill.getDate(),
        bill.getType(),
        bill.getDescription(),
        bill.getEntreprise(),
        bill.getInstallment(),
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
        bill.getCategoryId(),
        bill.getFreightOrderId(),
        0,
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
    const response = await bill.payOff(
      payoff.form,
      payoff.amount,
      payoff.date,
      situation,
      responsePendency,
    );
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10) return res.status(400).json('erro ao quitar a conta a pagar');
      if (response == -5) return res.status(400).json('campos incorretos');
      if (response == -1)
        return res.status(400).json('erro ao conectar ao banco de dados');
    }
    const resposneEvent = await this.createEvent(bill, situation, 2);
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
    const bill = await new BillPay().findOne(id);
    if (!bill) {
      await Database.instance.close();
      return res.status(400).json('conta inexistente');
    }
    if (bill.getSituation() == 1) {
      await Database.instance.close();
      return res.status(400).json('Esta conta ainda não foi quitada...');
    }
    const pend = await new BillPay().findOne(bill.getPendencyId());
    if (pend && pend.getSituation() > 1) {
      await Database.instance.close();
      return res
        .status(400)
        .json('Esta conta possui pendências pagas... Estorne-as primeiro.');
    }
    await Database.instance.beginTransaction();
    const response = await bill.reversal();
    if (response <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (response == -10)
        return res.status(400).json('erro ao estornar a conta a pagar');
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
          return res.status(400).json('Problema ao remover a pendência da despesa');
        if (responsePendency == -5) return res.status(400).json('campos incorretos');
        if (responsePendency == -1)
          return res.status(400).json('erro ao conectar ao banco de dados');
      }
    }
    const resposneEvent = await this.createEvent(bill, 0, 3);
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

  private createEvent = async (
    bill: BillPay,
    situation: number,
    method: number,
  ): Promise<number> => {
    if (bill.getId() <= 0 || situation <= 0) return -5;
    const activeUser = ActiveUser.getInstance() as ActiveUser;
    let description = '';
    if (method == 1) {
      description = `A despesa ${bill.getDescription()} foi lançada.`;
    }
    if (method == 2) {
      if (situation == 2) {
        description = `A conta a pagar "${bill.getDescription()}" foi quitada parcialmente.`;
      } else {
        description = `A conta a pagar "${bill.getDescription()}" foi quitada.`;
      }
    }
    if (method == 3) {
      description = `A conta a pagar "${bill.getDescription()}" foi estornada.`;
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

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro invalido');
    }
    await Database.instance.open();
    const bill = await new BillPay().findOne(id);
    if (!bill) {
      await Database.instance.close();
      return res.status(400).json('conta inexistente');
    }
    if (bill.getSituation() > 1 || bill.getPaymentDate()) {
      await Database.instance.close();
      return res.status(400).json('Não é possível remover uma conta já paga.');
    }
    if (bill.getDriverId() > 0 || bill.getEmployeeId() > 0) {
      await Database.instance.close();
      return res
        .status(400)
        .json(
          'Não é possível remover uma conta criada por um pedido, remova o pedido antes.',
        );
    }
    let installments: BillPay[] = [];
    if (bill.getType() > 1) {
      installments = await new BillPay().find({ bill: bill.getBill() });
    }
    await Database.instance.beginTransaction();
    if (bill.getType() == 1) {
      const response = await bill.delete();
      if (response <= 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (response == -10)
          return res.status(400).json('erro ao remover a conta a pagar');
        if (response == -5) return res.status(400).json('campos incorretos');
        if (response == -1)
          return res.status(400).json('erro ao conectar ao banco de dados');
      }
    } else {
      const responseInstallment = 0;
      for (
        let i = bill.getInstallment() - 1;
        i < installments.length && responseInstallment >= 0;
        i++
      ) {
        const responseInstallment = await installments[i].delete();
        if (responseInstallment <= 0) {
          await Database.instance.rollback();
          await Database.instance.close();
          if (responseInstallment == -10)
            return res.status(400).json('erro ao remover a conta a pagar');
          if (responseInstallment == -5) return res.status(400).json('campos incorretos');
          if (responseInstallment == -1)
            return res.status(400).json('erro ao conectar ao banco de dados');
        }
      }
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
