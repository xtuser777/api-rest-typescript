import { Request, Response } from 'express';
import Database from '../util/database';
import { SaleBudget } from '../model/sale-budget';
import { Employee } from '../model/employee';
import { Client } from '../model/client';
import { City } from '../model/city';
import { User } from '../model/user';
import { EmployeeController } from './employee-controller';
import { ClientController } from './client-controller';
import { CityController } from './city-controller';
import { SaleBudgetItem } from '../model/sale-budget-item';

export class SaleBudgetController {
  responseBuild = async (budget: SaleBudget): Promise<any> => {
    const employee = (await new Employee().find({ id: budget.getEmployeeId() }))[0];
    const client = await new Client().findOne(budget.getClientId());
    const city = (await new City().find({ id: budget.getCityId() }))[0];
    const user = (await new User().find({ id: budget.getUserId() }))[0];

    return {
      id: budget.getId(),
      date: budget.getDate(),
      description: budget.getDescription(),
      clientName: budget.getClientName(),
      clientDocument: budget.getClientDocument(),
      clientPhone: budget.getClientPhone(),
      clientCellphone: budget.getClientCellphone(),
      clientEmail: budget.getClientEmail(),
      weight: budget.getWeight(),
      value: budget.getValue(),
      validate: budget.getValidate(),
      salesman: !employee
        ? undefined
        : await new EmployeeController().responseBuild(employee, undefined),
      client: !client ? undefined : await new ClientController().responseBuild(client),
      destiny: !city ? undefined : await new CityController().responseBuild(city),
      author: !user
        ? undefined
        : await new EmployeeController().responseBuild(undefined, user),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const budgets = await new SaleBudget().find(req.body);
    const response = [];
    for (const budget of budgets) {
      response.push(await this.responseBuild(budget));
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
    const budget = await new SaleBudget().findOne(id);
    const response = !budget ? undefined : await this.responseBuild(budget);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');
    const budget = req.body.budget;
    const items = req.body.items;
    await Database.instance.open();
    await Database.instance.beginTransaction();
    const bgt = await new SaleBudget(
      0,
      budget.description,
      budget.date,
      budget.clientName,
      budget.clientDocument,
      budget.clientPhone,
      budget.clientCellphone,
      budget.clientEmail,
      budget.weight,
      budget.value,
      budget.validade,
      budget.salesman,
      budget.client,
      budget.destiny,
      budget.author,
    ).save();
    if (bgt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (bgt == -10) return res.status(400).json('erro ao inserir o orcamento.');
      if (bgt == -5) return res.status(400).json('campos incorretos no orcamento');
      if (bgt == -1) return res.status(400).json('erro conexao banco de dados.');
    }
    if (items.length == 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('orcamento sem itens.');
    }
    for (const item of items) {
      const itm = await new SaleBudgetItem(
        bgt,
        item.product,
        item.quantity,
        item.weight,
        item.price,
      ).save();
      if (itm < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (itm == -10) return res.status(400).json('erro ao inserir o item.');
        if (itm == -5) return res.status(400).json('campos incorretos no item');
        if (itm == -1) return res.status(400).json('erro conexao banco de dados.');
      }
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const budget = await new SaleBudget().findOne(id);
    if (!budget) return res.status(400).json('orcamento nao existe.');
    const itemsBanco = await new SaleBudgetItem().find({ budget: budget.getId() });
    await Database.instance.beginTransaction();
    const bgt = await budget.update(req.body.budget);
    if (bgt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (bgt == -10) return res.status(400).json('erro ao atualizar o orcamento.');
      if (bgt == -5) return res.status(400).json('campos incorretos no orcamento');
      if (bgt == -1) return res.status(400).json('erro conexao banco de dados.');
    }
    if (itemsBanco.length > 0) {
      for (const item of itemsBanco) {
        const itm = await item.delete();
        if (itm < 0) {
          await Database.instance.rollback();
          await Database.instance.close();
          if (itm == -10) return res.status(400).json('erro ao remover o item.');
          if (itm == -5) return res.status(400).json('campos incorretos no item');
          if (itm == -1) return res.status(400).json('erro conexao banco de dados.');
        }
      }
    }
    for (const item of req.body.items) {
      const itm = await new SaleBudgetItem(
        bgt,
        item.product,
        item.quantity,
        item.weight,
        item.price,
      ).save();
      if (itm < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (itm == -10) return res.status(400).json('erro ao inserir o item.');
        if (itm == -5) return res.status(400).json('campos incorretos no item');
        if (itm == -1) return res.status(400).json('erro conexao banco de dados.');
      }
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
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
    const budget = await new SaleBudget().findOne(id);
    if (!budget) return res.status(400).json('orcamento nao existe.');
    // inserir verificação de vículos ao terminar pedido de venda e orcamento de frete
    const items = await new SaleBudgetItem().find({ budget: budget.getId() });
    await Database.instance.beginTransaction();
    if (items.length > 0) {
      for (const item of items) {
        const itm = await item.delete();
        if (itm < 0) {
          await Database.instance.rollback();
          await Database.instance.close();
          if (itm == -10) return res.status(400).json('erro ao remover o item.');
          if (itm == -5) return res.status(400).json('campos incorretos no item');
          if (itm == -1) return res.status(400).json('erro conexao banco de dados.');
        }
      }
    }
    const bgt = await budget.delete();
    if (bgt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (bgt == -10) return res.status(400).json('erro ao remover o orcamento.');
      if (bgt == -5) return res.status(400).json('campos incorretos no orcamento');
      if (bgt == -1) return res.status(400).json('erro conexao banco de dados.');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
