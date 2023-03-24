import { Request, Response } from 'express';
import { City } from '../model/city';
import { Client } from '../model/client';
import { FreightBudget } from '../model/freight-budget';
import { FreightBudgetItem } from '../model/freight-budget-item';
import { Product } from '../model/product';
import { Representation } from '../model/representation';
import { SaleBudget } from '../model/sale-budget';
import { TruckType } from '../model/truck-type';
import { User } from '../model/user';
import Database from '../util/database';
import { CityController } from './city-controller';
import { ClientController } from './client-controller';
import { EmployeeController } from './employee-controller';
import { ProductController } from './product-controller';
import { RepresentationController } from './representation-controller';
import { SaleBudgetController } from './sale-budget-controller';
import { TruckTypeController } from './truck-type-controller';

export class FreightBudgetController {
  responseBuild = async (budget: FreightBudget): Promise<any> => {
    const sale = await new SaleBudget().findOne(budget.getSaleBudgetId());
    const representation = await new Representation().findOne(
      budget.getRepresentationId(),
    );
    const client = await new Client().findOne(budget.getClientId());
    const truckType = (await new TruckType().find({ id: budget.getTruckTypeId() }))[0];
    const city = (await new City().find({ id: budget.getCityId() }))[0];
    const user = (await new User().find({ id: budget.getUserId() }))[0];

    return {
      id: budget.getId(),
      date: budget.getDate(),
      description: budget.getDescription(),
      distance: budget.getDistance(),
      weight: budget.getWeight(),
      value: budget.getValue(),
      shipping: budget.getShipping(),
      validate: budget.getValidate(),
      sale: !sale ? undefined : await new SaleBudgetController().responseBuild(sale),
      representation: !representation
        ? undefined
        : await new RepresentationController().responseBuild(representation),
      client: !client ? undefined : await new ClientController().responseBuild(client),
      truckType: await new TruckTypeController().responseBuild(truckType),
      destiny: await new CityController().responseBuild(city),
      author: await new EmployeeController().responseBuild(undefined, user),
    };
  };

  responseBuildItem = async (item: FreightBudgetItem): Promise<any> => {
    const product = await new Product().findOne(item.getProductId());
    if (!product) return {};

    return {
      budget: item.getBudgetId(),
      product: await new ProductController().responseBuild(product),
      quantity: item.getQuantity(),
      weight: item.getWeight(),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.floor) return this.minimumFloor(req, res);
    if (req.body.items) return await this.indexItems(req, res);
    await Database.instance.open();
    const budgets = await new FreightBudget().find(req.body);
    const response = [];
    for (const budget of budgets) {
      response.push(await this.responseBuild(budget));
    }
    await Database.instance.close();

    return res.json(response);
  };

  indexItems = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const items = await new FreightBudgetItem().find(req.body.items);
    const response = [];
    for (const item of items) {
      response.push(await this.responseBuildItem(item));
    }
    await Database.instance.close();

    return res.json(response);
  };

  minimumFloor = (req: Request, res: Response): Response => {
    const km = Number.parseInt(req.body.floor.km);
    const axes = Number.parseInt(req.body.floor.axes);
    const response = new FreightBudget().calculateMinimumFloor(km, axes);

    return res.json(response);
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
    const budget = await new FreightBudget().findOne(id);
    const response = !budget ? undefined : await this.responseBuild(budget);
    await Database.instance.close();

    return res.json(response);
  };

  showItem = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente');
    if (!req.body.item) return res.status(400).json('parametro ausente');
    let budget = 0;
    let product = 0;
    try {
      budget = Number.parseInt(req.params.id);
      product = Number.parseInt(req.body.item);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const item = await new FreightBudgetItem().findOne(budget, product);
    const response = !item ? undefined : await this.responseBuildItem(item);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo');
    const budget = req.body.budget;
    const items = req.body.items;
    await Database.instance.open();
    await Database.instance.beginTransaction();
    const bgt = await new FreightBudget(
      0,
      budget.description,
      budget.date,
      budget.distance,
      budget.weight,
      budget.value,
      budget.shipping,
      budget.validate,
      budget.sale,
      budget.representation,
      budget.client,
      budget.truckType,
      budget.destiny,
      budget.author,
    ).save();
    if (bgt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (bgt == -10) return res.status(400).json('erro ao inserir o orcamento');
      if (bgt == -5) return res.status(400).json('campos invalidos no orcamento');
      if (bgt == -1) return res.status(400).json('erro de conexao ao banco');
    }
    if (items.length == 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('sem itens no orcamento');
    }
    for (const item of items) {
      const itm = await new FreightBudgetItem(
        bgt,
        item.product,
        item.quantity,
        item.weight,
      ).save();
      if (itm < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (itm == -10) return res.status(400).json('erro ao inserir o item');
        if (itm == -5) return res.status(400).json('campos invalidos no item');
        if (itm == -1) return res.status(400).json('erro de conexao ao banco');
      }
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const budget = await new FreightBudget().findOne(id);
    if (!budget) return res.status(400).json('orcamento nao existe');
    const itemsBd = await new FreightBudgetItem().find({ budget: id });
    await Database.instance.beginTransaction();
    const bgt = await budget.update(req.body.budget);
    if (bgt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (bgt == -10) return res.status(400).json('erro ao atualizar o orcamento');
      if (bgt == -5) return res.status(400).json('campos invalidos no orcamento');
      if (bgt == -1) return res.status(400).json('erro de conexao ao banco');
    }
    for (const item of itemsBd) {
      const itm = await item.delete();
      if (itm < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (itm == -10) return res.status(400).json('erro ao remover o item');
        if (itm == -5) return res.status(400).json('campos invalidos no item');
        if (itm == -1) return res.status(400).json('erro de conexao ao banco');
      }
    }
    if (req.body.items.length == 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('sem itens no orcamento');
    }
    for (const item of req.body.items) {
      const itm = await new FreightBudgetItem(
        id,
        item.product,
        item.quantity,
        item.weight,
      ).save();
      if (itm < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (itm == -10) return res.status(400).json('erro ao inserir o item');
        if (itm == -5) return res.status(400).json('campos invalidos no item');
        if (itm == -1) return res.status(400).json('erro de conexao ao banco');
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
    const budget = await new FreightBudget().findOne(id);
    if (!budget) return res.status(400).json('orcamento nao existe');
    const items = await new FreightBudgetItem().find({ budget: id });
    // adicionar verificacao de vículo com pedido de frete quando estiver concluído
    await Database.instance.beginTransaction();
    for (const item of items) {
      const itm = await item.delete();
      if (itm < 0) {
        await Database.instance.rollback();
        await Database.instance.close();
        if (itm == -10) return res.status(400).json('erro ao remover o item');
        if (itm == -5) return res.status(400).json('campos invalidos no item');
        if (itm == -1) return res.status(400).json('erro de conexao ao banco');
      }
    }
    const bgt = await budget.delete();
    if (bgt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (bgt == -10) return res.status(400).json('erro ao remover o orcamento');
      if (bgt == -5) return res.status(400).json('campos invalidos no orcamento');
      if (bgt == -1) return res.status(400).json('erro de conexao ao banco');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
