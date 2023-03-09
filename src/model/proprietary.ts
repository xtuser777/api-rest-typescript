import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  register?: string;
  type?: number;
  filter?: string;
  orderBy?: string;
}

export default class Proprietary {
  constructor(
    private id: number = 0,
    private register: string = '',
    private type: number = 0,
    private driverId: number = 0,
    private personId: number = 0,
  ) {}

  getId = () => this.id;
  getRegister = () => this.register;
  getType = () => this.type;
  getDriverId = () => this.driverId;
  getPersonId = () => this.personId;

  save = async (): Promise<number> => {
    if (this.id != 0 || this.register.trim().length == 0 || this.type <= 0) return -5;

    const parameters = [
      this.register,
      this.type,
      this.driverId == 0 ? null : this.driverId,
    ];

    const query = new QueryBuilder()
      .insert('proprietario', 'prp_cadastro, prp_tipo, mot_id', '?,?,?')
      .build();

    const insertedId = await Database.instance.insert(query, parameters);

    if (insertedId <= 0) return insertedId;

    if (this.type == 1) {
      const queryPF = new QueryBuilder()
        .insert('proprietario_pessoa_fisica', 'prp_id, pf_id', '?,?')
        .build();

      const result = await Database.instance.insert(queryPF, [insertedId, this.personId]);

      return result;
    } else {
      const queryPJ = new QueryBuilder()
        .insert('proprietario_pessoa_juridica', 'prp_id, pj_id', '?,?')
        .build();

      const result = await Database.instance.insert(queryPJ, [insertedId, this.personId]);

      return result;
    }
  };

  update = async (params: any): Promise<number> => {
    if (this.id <= 0) return -5;

    const parameters = [params.driver, this.id];

    const query = new QueryBuilder()
      .update('proprietario')
      .set('mot_id = ?')
      .where('prp_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    let resultPerson = 0;
    if (this.type == 1) {
      resultPerson = await this.delPF();
    } else {
      resultPerson = await this.delPJ();
    }

    if (resultPerson < 0) return resultPerson;

    const query = new QueryBuilder().delete('proprietario').where('prp_id = ?').build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  delPF = async (): Promise<number> => {
    const query = new QueryBuilder()
      .delete('proprietario_pessoa_fisica')
      .where('prp_id = ?')
      .and('pf_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id, this.personId]);

    return result;
  };

  delPJ = async (): Promise<number> => {
    const query = new QueryBuilder()
      .delete('proprietario_pessoa_juridica')
      .where('prp_id = ?')
      .and('pj_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id, this.personId]);

    return result;
  };

  findOne = async (id: number): Promise<Proprietary | undefined> => {
    if (id <= 0) return undefined;

    const query = new QueryBuilder()
      .select(`pp.prp_id,pp.prp_cadastro,pp.prp_tipo,pp.mot_id,ppf.pf_id,ppj.pj_id`)
      .from('proprietario pp')
      .leftJoin('proprietario_pessoa_fisica ppf')
      .on('pp.prp_id = ppf.prp_id')
      .leftJoin('proprietario_pessoa_juridica ppj')
      .on('pp.prp_id = ppj.prp_id')
      .leftJoin('pessoa_fisica pf')
      .on('pf.pf_id = ppf.pf_id')
      .leftJoin('pessoa_juridica pj')
      .on('pj.pj_id = ppj.pj_id')
      .where('pp.prp_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);

    if (rows.length == 0) return undefined;

    const row = rows[0];

    return new Proprietary(
      row.prp_id,
      row.prp_cadastro,
      row.prp_tipo,
      row.mot_id,
      row.prp_tipo == 1 ? row.pf_id : row.pj_id,
    );
  };

  find = async (fields?: IFields): Promise<Proprietary[]> => {
    const proprietaries: Proprietary[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(`pp.prp_id,pp.prp_cadastro,pp.prp_tipo,pp.mot_id,ppf.pf_id,ppj.pj_id`)
      .from('proprietario pp')
      .leftJoin('proprietario_pessoa_fisica ppf')
      .on('pp.prp_id = ppf.prp_id')
      .leftJoin('proprietario_pessoa_juridica ppj')
      .on('pp.prp_id = ppj.prp_id')
      .leftJoin('pessoa_fisica pf')
      .on('pf.pf_id = ppf.pf_id')
      .leftJoin('pessoa_juridica pj')
      .on('pj.pj_id = ppj.pj_id');

    if (fields) {
      if (fields.filter && fields.register) {
        parameters.push(fields.filter, fields.register);
        builder = builder
          .where('(pf.pf_nome like ? OR pj.pj_nome_fantasia like ?)')
          .and('pp.prp_cadastro = ?');
      }

      if (fields.filter) {
        parameters.push(fields.filter);
        builder = builder.where('pf.pf_nome like ?').or('pj.pj_nome_fantasia like ?');
      }

      if (fields.register) {
        parameters.push(fields.register);
        builder = builder.where('pp.prp_cadastro = ?');
      }

      if (fields.type) {
        parameters.push(fields.type);
        builder = builder
          .innerJoin('caminhao c2')
          .on('pp.prp_id = c2.prp_id')
          .where('c2.tip_cam_id = ?');
      }

      if (fields.orderBy) builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      proprietaries.push(
        new Proprietary(
          row.prp_id,
          row.prp_cadastro,
          row.prp_tipo,
          row.mot_id,
          row.prp_tipo == 1 ? row.pf_id : row.pj_id,
        ),
      );
    }

    return proprietaries;
  };
}
