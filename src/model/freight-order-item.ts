import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  order?: number;
  product?: number;
  orderBy?: string;
}

export class FreightOrderItem {
  constructor(
    private productId: number = 0,
    private quantity: number = 0,
    private weight: number = 0.0,
  ) {}

  getProductId = () => this.productId;
  getQuantity = () => this.quantity;
  getWeight = () => this.weight;

  save = async (order: number): Promise<any> => {
    if (order <= 0 || this.productId == 0 || this.quantity <= 0 || this.weight <= 0)
      return -5;

    const parameters = [order, this.productId, this.quantity, this.weight];

    const query = new QueryBuilder()
      .insert(
        'pedido_frete_produto',
        'ped_fre_id, pro_id, ped_fre_pro_quantidade, ped_fre_pro_peso',
        '?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  delete = async (order: number, product: number): Promise<number> => {
    if (order <= 0 && product <= 0) return -5;

    const query = new QueryBuilder()
      .delete('pedido_frete_produto')
      .where('ped_fre_id = ?')
      .and('pro_id = ?')
      .build();

    const result = await Database.instance.delete(query, [order, product]);

    return result;
  };

  findOne = async (
    order: number,
    product: number,
  ): Promise<FreightOrderItem | undefined> => {
    if (order <= 0 || product <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('pedido_venda_produto')
      .where('ped_fre_id = ?')
      .and('pro_id = ?')
      .build();

    const rows = await Database.instance.select(query, [order, product]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new FreightOrderItem(
      row.pro_id,
      row.ped_fre_pro_quantidade,
      row.ped_fre_pro_peso,
    );
  };

  find = async (fields?: IFields): Promise<FreightOrderItem[]> => {
    const items: FreightOrderItem[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('pedido_frete_produto');

    if (fields) {
      if (fields.order) {
        parameters.push(fields.order);
        builder = builder.where('ped_fre_id = ?');
      }

      if (fields.product) {
        parameters.push(fields.product);
        builder = builder.where('pro_id = ?').and('pro_id = ?');
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      items.push(
        new FreightOrderItem(
          row.pro_id,
          row.ped_fre_pro_quantidade,
          row.ped_fre_pro_peso,
        ),
      );
    }

    return items;
  };
}
