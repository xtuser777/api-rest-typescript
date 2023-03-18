import { Request, Response } from 'express';
import Database from '../util/database';
import { Product } from '../model/product';
import { Representation } from '../model/representation';
import { TruckType } from '../model/truck-type';
import { RepresentationController } from './representation-controller';

export class ProductController {
  responseBuild = async (product: Product): Promise<any> => {
    const representation = await new Representation().findOne(
      product.getRepresentationId(),
    );

    return {
      id: product.getId(),
      description: product.getDescription(),
      measure: product.getMeasure(),
      weight: Number.parseFloat(product.getWeight().toString()),
      price: Number.parseFloat(product.getPrice().toString()),
      priceOut: Number.parseFloat(product.getPriceOut().toString()),
      representation: !representation
        ? undefined
        : await new RepresentationController().responseBuild(representation),
      types: await product.getTypes(),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.types) return await this.getTypes(req, res);
    await Database.instance.open();
    const products = await new Product().find(req.body);
    const response = [];
    for (const product of products) response.push(await this.responseBuild(product));
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
    const product = await new Product().findOne(id);
    const response = !product ? undefined : await this.responseBuild(product);
    await Database.instance.close();

    return res.json(response);
  };

  getTypes = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body.types.product) return res.status(400).json('parametro ausente');
    let productId = 0;
    try {
      productId = Number.parseInt(req.body.types.product);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const product = await new Product().findOne(productId);
    if (!product) {
      await Database.instance.close();
      return res.status(400).json('produto nao existe.');
    }
    const types = await product.getTypes(req.body.types);
    await Database.instance.close();

    return res.json(types);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo');
    if (req.body.type) return await this.storeType(req, res);
    const product = req.body.product;
    await Database.instance.open();
    await Database.instance.beginTransaction();
    const pro = await new Product(
      0,
      product.description,
      product.measure,
      product.weight,
      product.price,
      product.priceOut == 0 ? product.price : product.priceOut,
      product.representation,
    ).save();
    if (pro <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (pro == -10) return res.status(400).json('erro ao inserir o produto');
      if (pro == -5) return res.status(400).json('campos incorretos no produto');
      if (pro == -1) return res.status(400).json('erro ao conectar ao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  storeType = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body.type.productId) return res.status(400).json('parametro ausente');
    let productId = 0;
    try {
      productId = Number.parseInt(req.body.type.productId);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const product = await new Product().findOne(productId);
    if (!product) {
      await Database.instance.close();
      return res.status(400).json('produto nao existe.');
    }
    await Database.instance.beginTransaction();
    const typ = await product.saveType(Number.parseInt(req.body.type.typeId));
    if (typ < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (typ == -10) return res.status(400).json('erro ao vincular o tipo de caminhao');
      if (typ == -5) return res.status(400).json('id do tipo incorreto.');
      if (typ == -1) return res.status(400).json('erro ao conectar ao banco de dados');
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
    const product = await new Product().findOne(id);
    if (!product) {
      await Database.instance.close();
      return res.status(400).json('produto nao existe.');
    }
    await Database.instance.beginTransaction();
    const pro = await product.update(req.body.product);
    if (pro <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (pro == -10) return res.status(400).json('erro ao atualizar o produto');
      if (pro == -5) return res.status(400).json('campos incorretos no produto');
      if (pro == -1) return res.status(400).json('erro ao conectar ao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (req.body.type) return await this.deleteType(req, res);
    if (!req.params.id) return res.status(400).json('parametro ausente');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const product = await new Product().findOne(id);
    if (!product) {
      await Database.instance.close();
      return res.status(400).json('produto nao existe.');
    }
    await Database.instance.beginTransaction();
    const pro = await product.delete();
    if (pro <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (pro == -10) return res.status(400).json('erro ao remover o produto');
      if (pro == -1) return res.status(400).json('erro ao conectar ao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  deleteType = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido');
    }
    await Database.instance.open();
    const product = await new Product().findOne(id);
    if (!product) {
      await Database.instance.close();
      return res.status(400).json('produto nao existe.');
    }
    await Database.instance.beginTransaction();
    const typ = await product.delType(Number.parseInt(req.body.type));
    if (typ < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (typ == -10) return res.status(400).json('erro ao desvincular o tipo.');
      if (typ == -5) return res.status(400).json('id do tipo incorreto.');
      if (typ == -1) return res.status(400).json('erro ao conectar ao banco de dados');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
