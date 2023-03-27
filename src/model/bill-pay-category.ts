import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  filter?: string;
  orderBy?: string;
}

export class BillPayCategory {
  constructor(private id: number = 0, private description: string = '') {}

  getId = () => this.id;
  getDescription = () => this.description;

  save = async (): Promise<number> => {
    if (this.id != 0 || this.description.length == 0) return -5;

    const query = new QueryBuilder()
      .insert('categoria_conta_pagar', 'cat_con_pag_descricao', '?')
      .build();

    const result = await Database.instance.insert(query, [this.description]);

    return result;
  };

  update = async (): Promise<number> => {
    if (this.id <= 0 || this.description.length == 0) return -5;

    const query = new QueryBuilder()
      .update('categoris_conta_pagar')
      .set('cat_con_pag_descricao = ?')
      .where('cat_con_pag_id = ?')
      .build();

    const result = await Database.instance.update(query, [this.description, this.id]);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('categoria_conta_pagar')
      .where('cat_con_pag_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<BillPayCategory | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('categoria_conta_pagar')
      .where('cat_con_pag_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new BillPayCategory(row.cat_con_pag_id, row.cat_con_pag_descricao);
  };

  find = async (fields?: IFields): Promise<BillPayCategory[]> => {
    const categories: BillPayCategory[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('categoria_conta_pagar');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`);
        builder = builder.where('cat_con_pag_descricao LIKE ?');
      }

      if (fields.orderBy) builder = builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      categories.push(new BillPayCategory(row.cat_con_pag_id, row.cat_con_pag_descricao));
    }

    return categories;
  };
}
