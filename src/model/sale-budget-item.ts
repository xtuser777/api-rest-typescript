import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  budget?: number;
  product?: number;
}

export class SaleBudgetItem {
  constructor(
    private budgetId: number = 0,
    private productId: number = 0,
    private quantity: number = 0,
    private weight: number = 0.0,
    private price: number = 0.0,
  ) {}

  getBudgetId = () => this.budgetId;
  getProductId = () => this.productId;
  getQuatity = () => this.quantity;
  getWeight = () => this.weight;
  getPrice = () => this.price;

  save = async (): Promise<number> => {
    if (
      this.budgetId == 0 ||
      this.productId == 0 ||
      this.quantity <= 0 ||
      this.price <= 0 ||
      this.weight <= 0
    )
      return -5;

    const parameters = [
      this.budgetId,
      this.productId,
      this.quantity,
      this.price,
      this.weight,
    ];

    const query = new QueryBuilder()
      .insert(
        'orcamento_venda_produto',
        'orc_ven_id,pro_id,orc_ven_pro_quantidade,orc_ven_pro_valor,orc_ven_pro_peso',
        '?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params?: any): Promise<number> => {
    if (
      this.budgetId <= 0 ||
      this.productId <= 0 ||
      params.quantity <= 0 ||
      params.price <= 0 ||
      params.weight <= 0
    )
      return -5;

    const parameters = [
      params.quantity,
      params.price,
      params.weight,
      this.budgetId,
      this.productId,
    ];

    const query = new QueryBuilder()
      .update('orcamento_venda_produto')
      .set('orc_ven_pro_quantidade = ?,orc_ven_pro_valor = ?,orc_ven_pro_peso = ?')
      .where('orc_ven_id = ?')
      .and('pro_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.budgetId == 0 || this.productId == 0) return -5;

    const query = new QueryBuilder()
      .delete('orcamento_venda_produto')
      .where('orc_ven_id = ?')
      .and('pro_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.budgetId, this.productId]);

    return result;
  };

  findOne = async (
    budget: number,
    product: number,
  ): Promise<SaleBudgetItem | undefined> => {
    if (budget <= 0 || product <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('orcamento_venda_produto')
      .where('orc_ven_id = ?')
      .and('pro_id = ?')
      .build();

    const rows = await Database.instance.select(query, [budget, product]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new SaleBudgetItem(
      row.orc_ven_id,
      row.pro_id,
      row.orc_ven_pro_quantidade,
      row.orc_ven_pro_peso,
      row.orc_ven_pro_valor,
    );
  };

  find = async (fields?: IFields): Promise<SaleBudgetItem[]> => {
    const budgets: SaleBudgetItem[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('orcamento_venda_produto');

    if (fields) {
      if (fields.budget) {
        parameters.push(fields.budget);
        builder = builder.where('orc_ven_id = ?');
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      budgets.push(
        new SaleBudgetItem(
          row.orc_ven_id,
          row.pro_id,
          row.orc_ven_pro_quantidade,
          row.orc_ven_pro_peso,
          row.orc_ven_pro_valor,
        ),
      );
    }

    return budgets;
  };
}
