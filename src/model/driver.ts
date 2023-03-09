import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  id?: number;
  register?: string;
  filter?: string;
  orderBy?: string;
}

export default class Driver {
  constructor(
    private id: number = 0,
    private register: string = '',
    private cnh: string = '',
    private personId: number = 0,
    private bankDataId: number = 0,
  ) {}

  getId = () => this.id;
  getRegister = () => this.register;
  getChn = () => this.cnh;
  getPersonId = () => this.personId;
  getBankDataId = () => this.bankDataId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.register.trim().length == 0 ||
      this.cnh.trim().length <= 0 ||
      this.personId == 0 ||
      this.bankDataId == 0
    )
      return -5;

    const parameters = [this.register, this.cnh, this.personId, this.bankDataId];

    const query = new QueryBuilder()
      .insert('motorista', 'mot_cadastro, mot_cnh, pf_id, dad_ban_id', '?,?,?,?')
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (
      this.id <= 0 ||
      params.cnh.trim().length <= 0 ||
      this.personId == 0 ||
      this.bankDataId == 0
    )
      return -5;

    const parameters = [this.cnh, this.id];

    const query = new QueryBuilder()
      .update('motorista')
      .set('mot_cnh = ?')
      .where('mot_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder().delete('motorista').where('mot_id = ?').build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<Driver | undefined> => {
    const query = new QueryBuilder()
      .select('*')
      .from('motorista')
      .where('mot_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);

    if (rows.length == 0) return undefined;

    const row = rows[0];

    return new Driver(
      row.mot_id,
      row.mot_cadastro,
      row.mot_cnh,
      row.pf_id,
      row.dad_ban_id,
    );
  };

  find = async (fields?: IFields): Promise<Driver[]> => {
    const drivers: Driver[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(`m.mot_id,m.mot_cadastro,m.mot_cnh,m.pf_id,m.dad_ban_id`)
      .from('motorista m')
      .innerJoin('pessoa_fisica pf')
      .on('pf.pf_id = m.pf_id')
      .innerJoin('contato ct')
      .on('ct.ctt_id = pf.ctt_id');

    if (fields) {
      if (fields.filter && fields.register) {
        parameters.push(fields.filter, fields.filter, fields.register);
        builder = builder
          .where('(pf.pf_nome like ? or ct.ctt_email like ?)')
          .and('m.mot_cadastro = ?');
      } else {
        if (fields.filter) {
          parameters.push(fields.filter, fields.filter);
          builder = builder.where('pf.pf_nome like ?').or('ct.ctt_email like ?');
        }

        if (fields.register) {
          parameters.push(fields.register);
          builder = builder.where('m.mot_cadastro = ?');
        }
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      drivers.push(
        new Driver(row.mot_id, row.mot_cadastro, row.mot_cnh, row.pf_id, row.dad_ban_id),
      );
    }

    return drivers;
  };
}
