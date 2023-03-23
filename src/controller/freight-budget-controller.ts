import { Request, Response } from 'express';
import { City } from '../model/city';
import { Client } from '../model/client';
import { FreightBudget } from '../model/freight-budget';
import { Representation } from '../model/representation';
import { SaleBudget } from '../model/sale-budget';
import { TruckType } from '../model/truck-type';
import { User } from '../model/user';
import Database from '../util/database';
import { CityController } from './city-controller';
import { ClientController } from './client-controller';
import { EmployeeController } from './employee-controller';
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

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const budgets = await new FreightBudget().find(req.body);
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
    const budget = await new FreightBudget().findOne(id);
    const response = !budget ? undefined : await this.responseBuild(budget);
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
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    return res.json();
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    return res.json();
  };
}
