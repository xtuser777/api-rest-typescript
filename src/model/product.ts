import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';
import { TruckType } from './truck-type';

interface IFields {
  filter?: string;
  unit?: string;
  representation?: number;
  orderBy?: string;
}

interface ITypesFields {
  filter?: string;
  orderBy?: string;
}

export class Product {
  constructor(
    private id: number = 0,
    private description: string = '',
    private measure: string = '',
    private weight: number = 0.0,
    private price: number = 0.0,
    private priceOut: number = 0.0,
    private representationId: number = 0,
  ) {}

  getId = () => this.id;
  getDescription = () => this.description;
  getMeasure = () => this.measure;
  getWeight = () => this.weight;
  getPrice = () => this.price;
  getPriceOut = () => this.priceOut;
  getRepresentationId = () => this.representationId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.description.trim().length <= 0 ||
      this.measure.trim().length <= 0 ||
      this.weight <= 0 ||
      this.price <= 0 ||
      this.representationId == 0
    )
      return -5;

    const parameters = [
      this.description,
      this.measure,
      this.weight,
      this.price,
      this.priceOut,
      this.representationId,
    ];

    const query = new QueryBuilder()
      .insert(
        'produto',
        'pro_descricao,pro_medida,pro_peso,pro_preco,pro_preco_out,rep_id',
        '?,?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  saveType = async (type: number): Promise<number> => {
    if (type <= 0) return -5;

    const query = new QueryBuilder()
      .insert('produto_tipo_caminhao', 'pro_id,tip_cam_id', '?,?')
      .build();

    const result = await Database.instance.insert(query, [this.id, type]);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (
      this.id <= 0 ||
      params.description.trim().length <= 0 ||
      params.measure.trim().length <= 0 ||
      params.weight <= 0 ||
      params.price <= 0 ||
      params.representationId == 0
    )
      return -5;

    const parameters = [
      params.description,
      params.measure,
      params.weight,
      params.price,
      params.priceOut,
      params.representationId,
      this.id,
    ];

    const query = new QueryBuilder()
      .update('produto')
      .set(
        'pro_descricao = ?, pro_medida = ?, pro_peso = ?, pro_preco = ?, pro_preco_out = ?, rep_id = ?',
      )
      .where('pro_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;
    const query = new QueryBuilder().delete('produto').where('pro_id = ?').build();
    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  delType = async (type: number): Promise<number> => {
    if (type <= 0) return -5;

    const query = new QueryBuilder()
      .delete('produto_tipo_caminhao')
      .where('pro_id = ?')
      .and('tip_cam_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id, type]);

    return result;
  };

  findOne = async (id: number): Promise<Product | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('produto')
      .where('pro_id = ?')
      .build();
    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new Product(
      row.pro_id,
      row.pro_descricao,
      row.pro_medida,
      row.pro_peso,
      row.pro_preco,
      row.pro_preco_out,
      row.rep_id,
    );
  };

  find = async (fields?: IFields): Promise<Product[]> => {
    const products: Product[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(
        `p.pro_id, p.pro_descricao, p.pro_medida, p.pro_peso, p.pro_preco, p.pro_preco_out,p.rep_id`,
      )
      .from('produto p')
      .innerJoin('representacao r')
      .on('r.rep_id = p.rep_id');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`);
        builder = builder.where('p.pro_descricao like ?');
      }

      if (fields.unit) {
        parameters.push(`%${fields.unit}%`);
        builder = builder.where('p.pro_medida like ?').and('p.pro_medida like ?');
      }

      if (fields.representation) {
        parameters.push(fields.representation);
        builder = builder.where('p.rep_id = ?').and('p.rep_id = ?');
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      products.push(
        new Product(
          row.pro_id,
          row.pro_descricao,
          row.pro_medida,
          row.pro_peso,
          row.pro_preco,
          row.pro_preco_out,
          row.rep_id,
        ),
      );
    }

    return products;
  };

  getTypes = async (fields?: ITypesFields): Promise<TruckType[]> => {
    const types: TruckType[] = [];
    const parameters: (number | string)[] = [this.id];

    let builder = new QueryBuilder()
      .select(
        'tc.tip_cam_id, tc.tip_cam_descricao, tc.tip_cam_eixos, tc.tip_cam_capacidade',
      )
      .from('tipo_caminhao tc')
      .innerJoin('produto_tipo_caminhao ptc')
      .on('ptc.tip_cam_id = tc.tip_cam_id')
      .where('ptc.pro_id = ?');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`);
        builder = builder.and('tc.tip_cam_descricao like ?');
      }

      if (fields.orderBy) builder = builder.orderBy('tc.' + fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      types.push(
        new TruckType(
          row.tip_cam_id,
          row.tip_cam_descricao,
          row.tip_cam_eixos,
          row.tip_cam_capacidade,
        ),
      );
    }

    return types;
  };

  verifyType = async (product: number, type: number): Promise<boolean> => {
    if (type <= 0) return false;

    const query = new QueryBuilder()
      .select('count(tip_cam_id) > 0 as res')
      .from('produto_tipo_caminhao')
      .where('pro_id = ?')
      .and('tip_cam_id = ?')
      .build();

    const rows = await Database.instance.select(query, [product, type]);

    return rows[0].res;
  };
}
