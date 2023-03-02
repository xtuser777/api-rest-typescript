import QueryBuilder from '../util/QueryBuilder';
import Database from '../util/database';

interface IFields {
  id?: number;
  street?: string;
  number?: number;
  neighborhood?: string;
  complement?: string;
  code?: string;
  city?: number;
}

export class Address {
  constructor(
    private id: number = 0,
    private street: string = '',
    private number: number = 0,
    private neighborhood: string = '',
    private complement: string = '',
    private code: string = '',
    private cityId: number = 0,
  ) {}

  getId = () => this.id;
  getStreet = () => this.street;
  getNumber = () => this.number;
  getNeighborhood = () => this.neighborhood;
  getComplement = () => this.complement;
  getCode = () => this.code;
  getCityId = () => this.cityId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.street.length == 0 ||
      this.number <= 0 ||
      this.neighborhood.length == 0 ||
      this.code.length == 0 ||
      this.cityId == 0
    )
      return -5;

    const db = Database.instance;
    let result = 0;
    const parameters = [
      this.street,
      this.number,
      this.neighborhood,
      this.complement,
      this.code,
      this.cityId,
    ];

    const builder = new QueryBuilder();

    const query = builder
      .insert(
        'endereco',
        'end_rua,end_numero,end_bairro,end_complemento,end_cep,cid_id',
        '?,?,?,?,?,?',
      )
      .build();

    result = await db.insert(query, parameters);

    return result;
  };

  find = async (fields?: IFields): Promise<Address[]> => {
    const db = Database.instance as Database;
    const addresses: Address[] = [];
    const parameters = [];

    let builder = new QueryBuilder();

    builder = builder.select('*').from('endereco');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('end_id = ?');
      }
    }

    const query = builder.build();

    const result = await db.select(query, parameters);

    for (const row of result) {
      const address = new Address();
      address.convert(row);
      addresses.push(address);
    }

    return addresses;
  };

  update = async (params: any): Promise<number> => {
    const db = Database.instance;

    let result = 0;

    const parameters = [
      params.street,
      params.number,
      params.neighborhood,
      params.complement,
      params.code,
      params.city,
      this.id,
    ];

    const builder = new QueryBuilder();
    const query = builder
      .update('endereco')
      .set(
        'end_rua = ?,end_numero = ?,end_bairro = ?,end_complemento = ?,end_cep = ?,cid_id = ?',
      )
      .where('end_id = ?')
      .build();

    result = await db.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const db = Database.instance;

    let result = 0;

    const query = new QueryBuilder().delete('endereco').where('end_id = ?').build();

    result = await db.delete(query, [this.id]);

    return result;
  };

  private convert = (row: any): void => {
    this.id = row.end_id;
    this.street = row.end_rua;
    this.number = row.end_numero;
    this.neighborhood = row.end_bairro;
    this.complement = row.end_complemento;
    this.code = row.end_cep;
    this.cityId = row.cid_id;
  };
}
