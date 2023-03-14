import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  register?: string;
  type?: number;
  initial?: string;
  end?: string;
  filter?: string;
  orderBy?: string;
}

export class Client {
  constructor(
    private id: number = 0,
    private register: string = '',
    private type: number = 0,
    private personId: number = 0,
  ) {}

  getId = () => this.id;
  getRegister = () => this.register;
  getType = () => this.type;
  getPersonId = () => this.personId;

  save = async (): Promise<number> => {
    if (this.id != 0 || this.register.trim().length == 0 || this.type <= 0) return -5;

    const parameters = [this.register, this.type];

    const query = new QueryBuilder()
      .insert('cliente', 'cli_cadastro, cli_tipo', '?,?')
      .build();

    const result = await Database.instance.insert(query, parameters);

    if (result <= 0) return result;

    return await this.addPerson(result, this.type, this.personId);
  };

  addPerson = async (id: number, type: number, person: number): Promise<number> => {
    let builder = new QueryBuilder();
    const parameters = [id];
    if (type == 1) {
      parameters.push(person);
      builder = builder.insert('cliente_pessoa_fisica', 'cli_id, pf_id', '?,?');
    }
    if (type == 2) {
      parameters.push(person);
      builder = builder.insert('cliente_pessoa_juridica', 'cli_id, pj_id', '?,?');
    }

    const query = builder.build();

    const result = await Database.instance.insert(query, parameters);

    return result >= 0 ? id : -10;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    let delPerson = 0;
    if (this.type == 1) delPerson = await this.delPhysicalPerson(this.id, this.personId);
    else delPerson = await this.delLegalPerson(this.id, this.personId);

    if (delPerson <= 0) return delPerson;

    const query = new QueryBuilder().delete('cliente').where('cli_id = ?').build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  delPhysicalPerson = async (id: number, personId: number): Promise<number> => {
    const query = new QueryBuilder()
      .delete('cliente_pessoa_fisica')
      .where('cli_id = ?')
      .and('pf_id = ?')
      .build();

    const result = await Database.instance.delete(query, [id, personId]);

    return result;
  };

  delLegalPerson = async (id: number, personId: number): Promise<number> => {
    const query = new QueryBuilder()
      .delete('cliente_pessoa_juridica')
      .where('cli_id = ?')
      .build();

    const result = await Database.instance.delete(query, [id, personId]);

    return result;
  };

  findOne = async (id: number): Promise<Client | undefined> => {
    if (id <= 0) return undefined;

    const query = new QueryBuilder()
      .select('cl.cli_id,cl.cli_cadastro,cl.cli_tipo,cpf.pf_id,cpj.pj_id')
      .from('cliente cl')
      .leftJoin('cliente_pessoa_fisica cpf')
      .on('cl.cli_id = cpf.cli_id')
      .leftJoin('cliente_pessoa_juridica cpj')
      .on('cl.cli_id = cpj.cli_id')
      .leftJoin('pessoa_fisica pf')
      .on('cpf.pf_id = pf.pf_id')
      .leftJoin('pessoa_juridica pj')
      .on('cpj.pj_id = pj.pj_id')
      .where('cl.cli_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);

    if (rows.length == 0) return undefined;

    const row = rows[0];

    return new Client(
      row.cli_id,
      row.cli_cadastro,
      row.cli_tipo,
      row.tipo == 1 ? row.pf_id : row.pj_id,
    );
  };

  find = async (fields?: IFields): Promise<Client[]> => {
    const clients: Client[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(
        `
      e.est_id, e.est_nome, e.est_sigla,
      c.cid_id, c.cid_nome,
      en.end_id, en.end_rua, en.end_numero, en.end_bairro, en.end_complemento, en.end_cep,
      ct.ctt_id, ct.ctt_telefone, ct.ctt_celular, ct.ctt_email,
      pf.pf_id, pf.pf_nome, pf.pf_rg, pf.pf_cpf, pf.pf_nascimento,
      pj.pj_id, pj.pj_razao_social, pj.pj_nome_fantasia, pj.pj_cnpj,
      cl.cli_id,cl.cli_cadastro,cl.cli_tipo
    `,
      )
      .from('cliente cl')
      .leftJoin('cliente_pessoa_fisica cpf')
      .on('cl.cli_id = cpf.cli_id')
      .leftJoin('cliente_pessoa_juridica cpj')
      .on('cl.cli_id = cpj.cli_id')
      .leftJoin('pessoa_fisica pf')
      .on('cpf.pf_id = pf.pf_id')
      .leftJoin('pessoa_juridica pj')
      .on('cpj.pj_id = pj.pj_id')
      .innerJoin('contato ct')
      .on('ct.ctt_id = pf.ctt_id or ct.ctt_id = pj.ctt_id')
      .innerJoin('endereco en')
      .on('en.end_id = ct.end_id')
      .innerJoin('cidade c')
      .on('c.cid_id = en.cid_id')
      .innerJoin('estado e')
      .on('e.est_id = c.est_id');

    if (fields) {
      if (fields.filter) {
        if (fields.register) {
          parameters.push(
            `%${fields.filter}%`,
            `%${fields.filter}%`,
            `%${fields.filter}%`,
            fields.register,
          );
          builder = builder
            .where(
              '(pf.pf_nome like ? or pj.pj_nome_fantasia like ? or ct.ctt_email like ?)',
            )
            .and('cl.cli_cadastro = ?');
        } else if (fields.initial && fields.end) {
          if (fields.type) {
            parameters.push(
              `%${fields.filter}%`,
              `%${fields.filter}%`,
              `%${fields.filter}%`,
              fields.initial,
              fields.end,
              fields.type,
            );
            builder = builder
              .where(
                '(pf.pf_nome like ? or pj.pj_nome_fantasia like ? or ct.ctt_email like ?)',
              )
              .and('(cl.cli_cadastro >= ? and cl.cli_cadastro <= ?)')
              .and('cl.cli_tipo = ?');
          } else {
            parameters.push(
              `%${fields.filter}%`,
              `%${fields.filter}%`,
              `%${fields.filter}%`,
              fields.initial,
              fields.end,
            );
            builder = builder
              .where(
                '(pf.pf_nome like ? or pj.pj_nome_fantasia like ? or ct.ctt_email like ?)',
              )
              .and('(cl.cli_cadastro >= ? and cl.cli_cadastro <= ?)');
          }
        } else if (fields.type) {
          parameters.push(
            `%${fields.filter}%`,
            `%${fields.filter}%`,
            `%${fields.filter}%`,
            fields.type,
          );
          builder = builder
            .where(
              '(pf.pf_nome like ? or pj.pj_nome_fantasia like ? or ct.ctt_email like ?)',
            )
            .and('cl.cli_tipo = ?');
        } else {
          parameters.push(
            `%${fields.filter}%`,
            `%${fields.filter}%`,
            `%${fields.filter}%`,
          );
          builder = builder
            .where('pf.pf_nome like ?')
            .or('pj.pj_nome_fantasia like ?')
            .or('ct.ctt_email like ?');
        }
      }

      if (fields.register) {
        parameters.push(fields.register);
        builder = builder.where('cl.cli_cadastro = ?');
      }

      if (fields.initial && fields.end) {
        if (fields.type) {
          parameters.push(fields.initial, fields.end, fields.type);
          builder = builder
            .where('(cl.cli_cadastro >= ? and cl.cli_cadastro <= ?)')
            .and('cl.cli_tipo = ?');
        } else {
          parameters.push(fields.initial, fields.end);
          builder = builder.where('(cl.cli_cadastro >= ? and cl.cli_cadastro <= ?)');
        }
      }

      if (fields.type) {
        parameters.push(fields.type);
        builder = builder.where('cl.cli_tipo = ?');
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      clients.push(
        new Client(
          row.cli_id,
          row.cli_cadastro,
          row.cli_tipo,
          row.tipo == 1 ? row.pf_id : row.pj_id,
        ),
      );
    }

    return clients;
  };
}
