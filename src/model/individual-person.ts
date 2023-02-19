import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';
import { Person } from './person';

interface IFields {
  id?: number;
}

export class IndividualPerson extends Person {
  constructor(
    protected id: number = 0,
    private name: string = '',
    private rg: string = '',
    private cpf: string = '',
    private birthDate: Date = new Date(),
    private contactId: number = 0,
  ) {
    super(id);
  }

  getName = () => this.name;
  getRg = () => this.rg;
  getCpf = () => this.cpf;
  getBirthDate = () => this.birthDate;
  getContactId = () => this.contactId;

  isCpf = (cpf: string): boolean => {
    if (cpf === '') return false;

    cpf = cpf.replaceAll('.', '');
    cpf = cpf.replace('-', '');

    // Elimina CPFs invalidos conhecidos
    if (
      cpf.length != 11 ||
      cpf == '00000000000' ||
      cpf == '11111111111' ||
      cpf == '22222222222' ||
      cpf == '33333333333' ||
      cpf == '44444444444' ||
      cpf == '55555555555' ||
      cpf == '66666666666' ||
      cpf == '77777777777' ||
      cpf == '88888888888' ||
      cpf == '99999999999'
    )
      return false;

    // Valida 1o digito
    let add = 0;
    for (let i = 0; i < 9; i++) {
      add += Number(cpf[i]) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) {
      rev = 0;
    }
    if (rev != Number(cpf[9])) {
      return false;
    }

    // Valida 2o digito
    add = 0;
    for (let i = 0; i < 10; i++) {
      add += Number(cpf[i]) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) {
      rev = 0;
    }
    if (rev != Number(cpf[10])) {
      return false;
    }

    return true;
  };

  countCpf = async (cpf: string): Promise<number> => {
    if (cpf.trim().length < 14) return -5;
    let count = 0;
    const parameters = [cpf];

    const query = new QueryBuilder()
      .select('count(pf_id) as cnt')
      .from('pessoa_fisica')
      .where('pf_cpf = ?')
      .build();

    const result = await Database.instance.select(query, parameters);

    count = Number.parseInt(result[0].cnt);

    return count;
  };

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.name.trim().length <= 0 ||
      this.rg.trim().length <= 0 ||
      this.cpf.trim().length <= 0 ||
      this.contactId == 0
    )
      return -5;

    let result = 0;

    const parameters = [this.name, this.rg, this.cpf, this.birthDate, this.contactId];

    const query = new QueryBuilder()
      .insert('pessoa_fisica', 'pf_nome,pf_rg,pf_cpf,pf_nascimento,ctt_id', '?,?,?,?,?')
      .build();

    result = await Database.instance.insert(query, parameters);

    return result;
  };

  find = async (fields?: IFields): Promise<Person[]> => {
    const persons: Person[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('pessoa_fisica ');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('pf_id = ?');
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      const person = new IndividualPerson();
      person.convert(row);
      persons.push(person);
    }

    return persons;
  };

  update = async (): Promise<number> => {
    if (
      this.id <= 0 ||
      this.name.trim().length <= 0 ||
      this.rg.trim().length <= 0 ||
      this.cpf.trim().length <= 0 ||
      this.contactId == 0
    )
      return -5;

    let result = 0;

    const parameters = [
      this.name,
      this.rg,
      this.cpf,
      this.birthDate,
      this.contactId,
      this.id,
    ];

    const query = new QueryBuilder()
      .update('pessoa_fisica')
      .set('pf_nome = ?, pf_rg = ?, pf_cpf = ?, pf_nascimento = ?, ctt_id = ?')
      .where('pf_id = ?')
      .build();

    result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    let result = 0;

    const parameters = [this.id];

    const query = new QueryBuilder().delete('pessoa_fisica').where('pf_id = ?').build();

    result = await Database.instance.delete(query, parameters);

    return result;
  };

  private convert = (row: any): void => {
    this.id = row.pf_id;
    this.name = row.pf_nome;
    this.rg = row.pf_rg;
    this.cpf = row.pf_cpf;
    this.birthDate = new Date(row.pf_nascimento);
    this.contactId = row.ctt_id;
  };
}
