import QueryBuilder from '../util/QueryBuilder';
import Database from '../util/database';
import bcryptjs from 'bcryptjs';

interface IFields {
  id?: number;
  login?: string;
  active?: boolean;
  filter?: string;
  employeeAdmission?: string;
  orderBy?: string;
}

export class User {
  constructor(
    private id: number = 0,
    private login: string = '',
    private password: string = '',
    private password_hash: string = '',
    private active: boolean = false,
    private employeeId: number = 0,
    private levelId: number = 0,
  ) {}

  getId = () => this.id;
  getLogin = () => this.login;
  getPassword = () => this.password;
  getPasswordHash = () => this.password_hash;
  isActive = () => this.active;
  getEmployeeId = () => this.employeeId;
  getLevelId = () => this.levelId;

  autenticate = async (password: string) =>
    bcryptjs.compare(password, this.password_hash);

  save = async (): Promise<number> => {
    if (this.id != 0 || this.employeeId === 0 || this.levelId === 0) return -5;

    let result = 0;
    const parameters = [
      this.login,
      await bcryptjs.hash(this.password, 8),
      this.active,
      this.employeeId,
      this.levelId,
    ];

    const query = new QueryBuilder()
      .insert('usuario', 'usu_login,usu_senha_hash,usu_ativo,fun_id,niv_id', '?,?,?,?,?')
      .build();

    result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (this.id <= 0 || params.level === 0) return -5;

    let result = 0;
    // const parameters = params.password
    //   ? [params.login, await bcryptjs.hash(params.password, 8), params.level, this.id]
    //   : [params.login, params.level, this.id];

    const parameters = [];
    parameters.push(params.login);
    if (params.password) parameters.push(await bcryptjs.hash(params.password, 8));
    if (params.active != undefined) parameters.push(params.active);
    parameters.push(params.level, this.id);

    const query = new QueryBuilder()
      .update('usuario')
      .set(
        `usu_login = ?,${params.password ? 'usu_senha_hash = ?,' : ''}${
          params.active != undefined ? 'usu_ativo = ?,' : ''
        }niv_id = ?`,
      )
      .where('usu_id = ?')
      .build();

    result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    let result = 0;
    const parameters = [this.id];

    const query = new QueryBuilder().delete('usuario').where('usu_id = ?').build();

    result = await Database.instance.delete(query, parameters);

    return result;
  };

  find = async (fields?: IFields): Promise<User[]> => {
    const users: User[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(`u.usu_id,u.usu_login,u.usu_senha_hash,u.usu_ativo,u.fun_id,u.niv_id`)
      .from('usuario u')
      .innerJoin('nivel n')
      .on('n.niv_id = u.niv_id')
      .innerJoin('funcionario f')
      .on('f.fun_id = u.fun_id')
      .innerJoin('pessoa_fisica pf')
      .on('pf.pf_id = f.pf_id')
      .innerJoin('contato ct')
      .on('ct.ctt_id = pf.ctt_id');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('u.usu_id = ?');
      }

      if (fields.login) {
        parameters.push(fields.login);
        builder = builder.where('u.usu_login = ?').and('u.usu_ativo = true');
      }

      if (fields.filter) {
        if (fields.employeeAdmission) {
          parameters.push(
            `%${fields.filter}%`,
            `%${fields.filter}%`,
            `%${fields.filter}%`,
            fields.employeeAdmission,
          );
          builder = builder
            .where('(u.usu_login like ? or pf.pf_nome like ? or ct.ctt_id like ?)')
            .and('date(f.fun_admissao) = date(?)');
        } else {
          parameters.push(
            `%${fields.login}%`,
            `%${fields.filter}%`,
            `%${fields.filter}%`,
          );
          builder = builder
            .where('u.usu_login like ?')
            .or('pf.pf_nome like ?')
            .or('ct.ctt_id like ?');
        }
      } else {
        if (fields.employeeAdmission) {
          parameters.push(fields.employeeAdmission);
          builder = builder.where('date(f.fun_admissao) = date(?)');
        }
      }

      if (fields.orderBy) builder = builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      users.push(
        new User(
          row.usu_id,
          row.usu_login,
          '',
          row.usu_senha_hash,
          row.usu_ativo,
          row.fun_id,
          row.niv_id,
        ),
      );
    }

    return users;
  };

  adminCount = async (): Promise<number> => {
    let count = 0;
    const query = new QueryBuilder()
      .select('count(usuario.usu_id) as admins')
      .from('usuario')
      .innerJoin('funcionario')
      .on('usuario.fun_id = funcionario.fun_id')
      .where('usuario.niv_id = 1')
      .and('funcionario.fun_demissao is null')
      .build();

    count = (await Database.instance.select(query))[0].admins;

    return Number.parseInt(count.toString());
  };

  loginCount = async (login: string): Promise<number> => {
    let count = 0;
    const query = new QueryBuilder()
      .select('count(usu_id) as logins')
      .from('usuario')
      .where('usu_login = ?')
      .build();

    count = (await Database.instance.select(query, [login]))[0].logins;

    return Number.parseInt(count.toString());
  };
}
