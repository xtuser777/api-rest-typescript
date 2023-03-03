import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

export class Parameterization {
  constructor(
    private id: number = 0,
    private logotype: string = '',
    private personId: number = 0,
  ) {}

  getId = () => this.id;

  getLogotype = () => this.logotype;

  getPersonId = () => this.personId;

  async save(): Promise<number> {
    if (this.id != 1 || this.personId == 0) return -5;

    const query = new QueryBuilder()
      .insert('parametrizacao', 'par_id, par_logotipo, pj_id', '?,?,?')
      .build();

    const result = await Database.instance.insert(query, [
      this.id,
      this.logotype,
      this.personId,
    ]);

    return result;
  }

  async find(): Promise<Parameterization | undefined> {
    const query = new QueryBuilder()
      .select(`par_id, par_logotipo, pj_id`)
      .from('parametrizacao')
      .where('par_id = 1')
      .build();

    const rows = await Database.instance.select(query);

    const parametrization =
      rows.length > 0
        ? new Parameterization(rows[0].par_id, rows[0].par_logotipo, rows[0].pj_id)
        : undefined;

    return parametrization;
  }

  async update(logotype: string): Promise<number> {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .update('parametrizacao')
      .set('par_logotipo = ?')
      .where('par_id = ?')
      .build();

    const result = await Database.instance.update(query, [logotype, this.id]);

    return result;
  }
}
