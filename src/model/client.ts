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
      row.cli_tipo == 1 ? row.pf_id : row.pj_id,
    );
  };

  find = async (fields?: IFields): Promise<Client[]> => {
    const clients: Client[] = [];

    const builder = new QueryBuilder()
      .select(`cl.cli_id,cl.cli_cadastro,cl.cli_tipo,cpf.pf_id,cpj.pj_id`)
      .from('cliente cl')
      .leftJoin('cliente_pessoa_fisica cpf')
      .on('cl.cli_id = cpf.cli_id')
      .leftJoin('cliente_pessoa_juridica cpj')
      .on('cl.cli_id = cpj.cli_id')
      .leftJoin('pessoa_fisica pf')
      .on('cpf.pf_id = pf.pf_id')
      .leftJoin('pessoa_juridica pj')
      .on('cpj.pj_id = pj.pj_id');

    const query = builder.build();

    const rows = await Database.instance.select(query);

    for (const row of rows) {
      clients.push(
        new Client(
          row.cli_id,
          row.cli_cadastro,
          row.cli_tipo,
          row.cli_tipo == 1 ? row.pf_id : row.pj_id,
        ),
      );
    }

    return clients;
  };
}
