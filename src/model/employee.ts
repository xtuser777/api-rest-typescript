import QueryBuilder from '../util/QueryBuilder';
import Database from '../util/database';

interface IFields {
  id?: number;
  type?: number;
  orderBy?: string;
}

export class Employee {
  constructor(
    private id: number = 0,
    private type: number = 0,
    private admission: Date | undefined = undefined,
    private demission: Date | undefined = undefined,
    private personId: number = 0,
  ) {}

  getId = () => this.id;
  getType = () => this.type;
  getAdmission = () => this.admission;
  getDemission = () => this.demission;
  getPersonId = () => this.personId;

  save = async (): Promise<number> => {
    if (this.id != 0 || this.type <= 0 || this.admission == null || this.personId === 0)
      return -5;

    let result = 0;
    const parameters = [this.type, this.admission, this.personId];

    const query = new QueryBuilder()
      .insert('funcionario', 'fun_tipo,fun_admissao,pf_id', '?,?,?')
      .build();

    result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (this.id <= 0 || params.type <= 0 || params.admission == null) return -5;

    let result = 0;
    const parameters = [params.type, params.admission, this.id];

    const query = new QueryBuilder()
      .update('funcionario')
      .set('fun_tipo = ?, fun_admissao = ?')
      .where('fun_id = ?')
      .build();

    result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    let result = 0;
    const parameters = [this.id];

    const query = new QueryBuilder().delete('funcionario').where('fun_id = ?').build();

    result = await Database.instance.delete(query, parameters);

    return result;
  };

  desactivate = async (id: number): Promise<number> => {
    if (id <= 0) return -5;

    let result = 0;
    const parameters = [id];

    const query = new QueryBuilder()
      .update('usuario u')
      .innerJoin('funcionario f')
      .on('f.fun_id = u.fun_id')
      .set('u.usu_ativo = false, f.fun_demissao = now()')
      .where('u.usu_id = ?')
      .build();

    result = await Database.instance.update(query, parameters);

    return result;
  };

  reactivate = async (id: number): Promise<number> => {
    if (id <= 0) return -5;

    let result = 0;
    const parameters = [id];

    const query = new QueryBuilder()
      .update('usuario u')
      .innerJoin('funcionario f')
      .on('f.fun_id = u.fun_id')
      .set('u.usu_ativo = true, f.fun_demissao = null')
      .where('u.usu_id = ?')
      .build();

    result = await Database.instance.update(query, parameters);

    return result;
  };

  find = async (fields?: IFields): Promise<Employee[]> => {
    const employees: Employee[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('funcionario ');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('fun_id = ?');
      }

      if (fields.type) {
        parameters.push(fields.type);
        builder = builder.where('fun_tipo = ?');
      }

      if (fields.orderBy) builder = builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      employees.push(
        new Employee(
          row.fun_id,
          row.fun_tipo,
          row.fun_admissao,
          row.fun_demission,
          row.pf_id,
        ),
      );
    }

    return employees;
  };
}
