import QueryBuilder from '../util/QueryBuilder';
import Database from '../util/database';

interface IFields {
  register?: string;
  filter?: string;
  orderBy?: string;
}

export class Representation {
  constructor(
    private id: number = 0,
    private register: string = '',
    private unity: string = '',
    private personId: number = 0,
  ) {}

  getId = () => this.id;
  getRegister = () => this.register;
  getUnity = () => this.unity;
  getPersonId = () => this.personId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.unity.trim() === '' ||
      this.register.trim() === '' ||
      this.personId == 0
    )
      return -5;

    let result = 0;
    const parameters = [this.register, this.unity, this.personId];

    const query = new QueryBuilder()
      .insert('representacao', 'rep_cadastro, rep_unidade, pj_id', '?,?,?')
      .build();

    result = await Database.instance.insert(query, parameters);

    return Number.parseInt(result.toString());
  };

  update = async (params: any): Promise<number> => {
    if (this.id <= 0 || params.unity.trim() === '') return -5;

    let result = 0;
    const parameters = [params.unity, this.id];

    const query = new QueryBuilder()
      .update('representacao')
      .set('rep_unidade = ?')
      .where('rep_id = ?')
      .build();

    result = await Database.instance.update(query, parameters);

    return Number.parseInt(result.toString());
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    let result = 0;
    const query = new QueryBuilder().delete('representacao').where('rep_id = ?').build();

    result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<Representation | undefined> => {
    if (id <= 0) return undefined;

    const query = new QueryBuilder()
      .select('*')
      .from('representacao')
      .where('rep_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);

    if (rows.length == 0) return undefined;

    const row = rows[0];

    return new Representation(row.rep_id, row.rep_cadastro, row.rep_unidade, row.pj_id);
  };

  find = async (fields?: IFields): Promise<Representation[]> => {
    const representations: Representation[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(`r.rep_id, r.rep_cadastro, r.rep_unidade, r.pj_id`)
      .from('representacao r')
      .innerJoin('pessoa_juridica p')
      .on('p.pj_id = r.pj_id')
      .innerJoin('contato ct')
      .on('ct.ctt_id = p.ctt_id');

    if (fields) {
      if (fields.filter && fields.register) {
        parameters.push(`%${fields.filter}%`, `%${fields.filter}%`, fields.register);
        builder = builder
          .where('(p.pj_nome_fantasia like ? or ct.ctt_email like ?)')
          .and('r.rep_cadastro = ?');
      }

      if (fields.filter) {
        parameters.push(`%${fields.filter}%`, `%${fields.filter}%`);
        builder = builder.where('p.pj_nome_fantasia like ?').or('ct.ctt_email like ?');
      }

      if (fields.register) {
        parameters.push(fields.register);
        builder = builder.where('r.rep_cadastro = ?');
      }

      if (fields.orderBy) builder = builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      representations.push(
        new Representation(row.rep_id, row.rep_cadastro, row.rep_unidade, row.pj_id),
      );
    }

    return representations;
  };
}
