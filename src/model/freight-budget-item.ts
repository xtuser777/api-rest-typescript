import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  budget?: number;
  product?: number;
}

export class FreightBudgetItem {
  constructor(
    private budgetId: number = 0,
    private productId: number = 0,
    private quantity: number = 0.0,
    private weight: number = 0.0,
  ) {}

  getBudgetId = () => this.budgetId;
  getProductId = () => this.productId;
  getQuantity = () => this.quantity;
  getWeight = () => this.weight;

  save = async (): Promise<number> => {
    if (
      this.budgetId == 0 ||
      this.productId == 0 ||
      this.quantity <= 0 ||
      this.weight <= 0
    )
      return -5;

    const parameters = [this.budgetId, this.productId, this.quantity, this.weight];

    const query = new QueryBuilder()
      .insert(
        'orcamento_frete_produto',
        'orc_fre_id,pro_id,orc_fre_pro_quantidade,orc_fre_pro_peso',
        '?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (): Promise<number> => {
    if (
      this.budgetId <= 0 ||
      this.productId <= 0 ||
      this.quantity <= 0 ||
      this.weight <= 0
    )
      return -5;

    const parameters = [this.quantity, this.weight, this.budgetId, this.productId];

    const query = new QueryBuilder()
      .update('orcamento_frete_produto')
      .set('orc_fre_pro_quantidade = ?,orc_fre_pro_peso = ?')
      .where('orc_fre_id = ?')
      .and('pro_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.budgetId == 0 || this.productId == 0) return -5;

    const query = new QueryBuilder()
      .delete('orcamento_frete_produto')
      .where('orc_fre_id = ?')
      .and('pro_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.budgetId, this.productId]);

    return result;
  };

  findOne = async (
    budget: number,
    product: number,
  ): Promise<FreightBudgetItem | undefined> => {
    if (budget <= 0 || product <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('orcamento_frete_produto')
      .where('orc_fre_id = ?')
      .and('pro_id = ?')
      .build();

    const rows = await Database.instance.select(query, [budget, product]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new FreightBudgetItem(
      row.orc_fre_id,
      row.pro_id,
      row.orc_fre_pro_quantidade,
      row.orc_fre_pro_peso,
    );
  };

  find = async (fields?: IFields): Promise<FreightBudgetItem[]> => {
    const items: FreightBudgetItem[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('orcamento_frete_produto');

    if (fields) {
      if (fields.budget) {
        parameters.push(fields.budget);
        builder = builder.where('orc_fre_id = ?');
      }

      if (fields.product) {
        parameters.push(fields.product);
        builder = builder.where('pro_id = ?');
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      items.push(
        new FreightBudgetItem(
          row.orc_fre_id,
          row.pro_id,
          row.orc_fre_pro_quantidade,
          row.orc_fre_pro_peso,
        ),
      );
    }

    return items;
  };
}
