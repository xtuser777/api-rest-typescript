import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';
import { Person } from './person';

interface IFields {
  id?: number;
}

export class EnterprisePerson extends Person {
  constructor(
    protected id: number = 0,
    private corporateName: string = '',
    private fantasyName: string = '',
    private cnpj: string = '',
    private contactId: number = 0,
  ) {
    super(id);
  }

  getCorporateName = () => this.corporateName;
  getFantasyName = () => this.fantasyName;
  getCnpj = () => this.cnpj;
  getContactId = () => this.contactId;

  isCnpj = (cnpj: string): boolean => {
    cnpj = cnpj.replaceAll('.', '');
    cnpj = cnpj.replace('/', '');
    cnpj = cnpj.replace('-', '');

    if (cnpj === '') return false;

    if (cnpj.length !== 14) return false;

    // Elimina CNPJs invalidos conhecidos
    if (
      cnpj === '00000000000000' ||
      cnpj === '11111111111111' ||
      cnpj === '22222222222222' ||
      cnpj === '33333333333333' ||
      cnpj === '44444444444444' ||
      cnpj === '55555555555555' ||
      cnpj === '66666666666666' ||
      cnpj === '77777777777777' ||
      cnpj === '88888888888888' ||
      cnpj === '99999999999999'
    )
      return false;

    // Valida DVs
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += Number(numeros[tamanho - i]) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado.toString()[0] !== digitos[0]) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += Number(numeros[tamanho - i]) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado.toString()[0] !== digitos[1]) return false;

    return true;
  };

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.corporateName.trim().length <= 0 ||
      this.fantasyName.trim().length <= 0 ||
      this.cnpj.trim().length < 18 ||
      this.contactId == 0
    )
      return -5;

    let result = 0;
    const parameters = [this.corporateName, this.fantasyName, this.cnpj, this.contactId];

    const query = new QueryBuilder()
      .insert(
        'pessoa_juridica',
        'pj_razao_social,pj_nome_fantasia,pj_cnpj,ctt_id',
        '?,?,?,?',
      )
      .build();

    result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (
      this.id <= 0 ||
      params.corporateName.trim().length <= 0 ||
      params.fantasyName.trim().length <= 0 ||
      params.cnpj.trim().length < 18
    )
      return -5;

    let result = 0;
    const parameters = [params.corporateName, params.fantasyName, this.id];

    const query = new QueryBuilder()
      .update('pessoa_juridica')
      .set('pj_razao_social = ?,pj_nome_fantasia = ?')
      .where('pj_id = ?')
      .build();

    result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    let result = 0;
    const parameters = [this.id];

    const query = new QueryBuilder().delete('pessoa_juridica').where('pj_id = ?').build();

    result = await Database.instance.delete(query, parameters);

    return result;
  };

  find = async (fields?: IFields): Promise<Person[]> => {
    const persons: Person[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('pessoa_juridica');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('pj_id = ?');
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      const person = new EnterprisePerson();
      person.convert(row);
      persons.push(person);
    }

    return persons;
  };

  private convert = (row: any): void => {
    this.id = row.pj_id;
    this.corporateName = row.pj_razao_social;
    this.fantasyName = row.pj_nome_fantasia;
    this.cnpj = row.pj_cnpj;
    this.contactId = row.ctt_id;
  };
}
