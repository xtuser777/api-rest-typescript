import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  order?: number;
  product?: number;
}

export class SalesOrderItem {
  constructor(
    private productId: number = 0,
    private quantity: number = 0,
    private price: number = 0.0,
    private weight: number = 0.0,
  ) {}

  getProductId = () => this.productId;
  getQuantity = () => this.quantity;
  getPrice = () => this.price;
  getWeight = () => this.weight;

  save = async (order: number): Promise<number> => {
    if (
      order <= 0 ||
      this.productId <= 0 ||
      this.quantity <= 0 ||
      this.price <= 0 ||
      this.weight <= 0
    )
      return -5;

    const parameters = [order, this.productId, this.quantity, this.price, this.weight];

    const query = new QueryBuilder()
      .insert(
        'pedido_venda_produto',
        `ped_ven_id,pro_id,ped_ven_pro_quantidade,ped_ven_pro_valor,ped_ven_pro_peso`,
        '?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  delete = async (order: number): Promise<number> => {
    if (order <= 0 && this.productId <= 0) return -5;

    const query = new QueryBuilder()
      .delete('pedido_venda_produto')
      .where('ped_ven_id = ?')
      .and('pro_id = ?')
      .build();

    const result = await Database.instance.delete(query, [order, this.productId]);

    return result;
  };

  findOne = async (
    order: number,
    product: number,
  ): Promise<SalesOrderItem | undefined> => {
    if (order <= 0 || product <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('pedido_venda_produto')
      .where('ped_ven_id = ?')
      .and('pro_id = ?')
      .build();

    const rows = await Database.instance.select(query, [order, product]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new SalesOrderItem(
      row.pro_id,
      row.ped_ven_pro_quantidade,
      row.ped_ven_pro_valor,
      row.ped_ven_pro_peso,
    );
  };

  find = async (fields?: IFields): Promise<SalesOrderItem[]> => {
    const items: SalesOrderItem[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('pedido_venda_produto');

    if (fields) {
      if (fields.order) {
        parameters.push(fields.order);
        builder = builder.where('ped_ven_id = ?');
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      items.push(
        new SalesOrderItem(
          row.pro_id,
          row.ped_ven_pro_quantidade,
          row.ped_ven_pro_valor,
          row.ped_ven_pro_peso,
        ),
      );
    }

    return items;
  };
}
