import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  filter?: string;
  link?: number;
  orderBy?: string;
}

export class PaymentForm {
  constructor(
    private id: number = 0,
    private description: string = '',
    private link: number = 0,
    private deadline: number = 0,
  ) {}

  getId = () => this.id;
  getDescription = () => this.description;
  getLink = () => this.link;
  getDeadline = () => this.deadline;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.description.length <= 0 ||
      this.link <= 0 ||
      this.deadline <= 0
    )
      return -5;

    const parameters = [this.description, this.link, this.deadline];
    const query = new QueryBuilder()
      .insert(
        'forma_pagamento',
        'for_pag_descricao, for_pag_vinculo, for_pag_prazo',
        '?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (
      this.id <= 0 ||
      params.description.length <= 0 ||
      params.link <= 0 ||
      params.deadline <= 0
    )
      return -5;

    const parameters = [params.description, params.link, params.deadline, this.id];
    const query = new QueryBuilder()
      .update('forma_pagamento')
      .set('for_pag_descricao = ?, for_pag_vinculo = ?, for_pag_prazo = ?')
      .where('for_pag_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;
    const query = new QueryBuilder()
      .delete('forma_pagamento')
      .where('for_pag_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<PaymentForm | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('forma_pagamento')
      .where('for_pag_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new PaymentForm(
      row.for_pag_id,
      row.for_pag_descricao,
      row.for_pag_vinculo,
      row.for_pag_prazo,
    );
  };

  find = async (fields?: IFields): Promise<PaymentForm[]> => {
    const forms: PaymentForm[] = [];
    const parameters = [];
    let builder = new QueryBuilder().select('*').from('forma_pagamento');
    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`);
        builder = builder.where('for_pag_descricao like ?');
      }
      if (fields.link) {
        parameters.push(fields.link);
        builder = builder.where('for_pag_vinculo = ?').and('for_pag_vinculo = ?');
      }
      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }
    const query = builder.build();
    const rows = await Database.instance.select(query, parameters);
    for (const row of rows) {
      forms.push(
        new PaymentForm(
          row.for_pag_id,
          row.for_pag_descricao,
          row.for_pag_vinculo,
          row.for_pag_prazo,
        ),
      );
    }

    return forms;
  };
}
