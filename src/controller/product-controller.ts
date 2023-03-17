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
      weight: product.getWeight(),
      price: product.getPrice(),
      priceOut: product.getPriceOut(),
      representation: !representation
        ? undefined
        : await new RepresentationController().responseBuild(representation),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    return res.json();
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    return res.json();
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    return res.json();
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    return res.json();
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    return res.json();
  };
}
