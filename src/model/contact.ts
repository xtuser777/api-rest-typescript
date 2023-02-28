import isEmail from 'validator/lib/isEmail';
import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  id?: number;
}

export class Contact {
  constructor(
    private id: number = 0,
    private phone: string = '',
    private cellphone: string = '',
    private email: string = '',
    private addressId: number = 0,
  ) {}

  getId = () => this.id;
  getPhone = () => this.phone;
  getCellphone = () => this.cellphone;
  getEmail = () => this.email;
  getAddressId = () => this.addressId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.phone.length < 14 ||
      this.cellphone.length < 15 ||
      !isEmail(this.email) ||
      this.addressId == 0
    )
      return -5;

    const parameters = [this.phone, this.cellphone, this.email, this.addressId];

    const query = new QueryBuilder()
      .insert('contato', 'ctt_telefone,ctt_celular,ctt_email,end_id', '?,?,?,?')
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  find = async (fields?: IFields): Promise<Contact[]> => {
    const contacts: Contact[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('contato');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('ctt_id = ?');
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      const contact = new Contact();
      contact.convert(row);
      contacts.push(contact);
    }

    return contacts;
  };

  update = async (): Promise<number> => {
    if (
      this.id <= 0 ||
      this.phone.length < 14 ||
      this.cellphone.length < 15 ||
      !isEmail(this.email) ||
      this.addressId == 0
    )
      return -5;

    const parameters = [this.phone, this.cellphone, this.email, this.addressId, this.id];

    const query = new QueryBuilder()
      .update('contato')
      .set('ctt_telefone = ?, ctt_celular = ?, ctt_email = ?, end_id = ?')
      .where('ctt_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder().delete('contato').where('ctt_id = ?').build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  private convert = (row: any): void => {
    this.id = row.ctt_id;
    this.phone = row.ctt_telefone;
    this.cellphone = row.ctt_celular;
    this.email = row.ctt_email;
    this.addressId = row.end_id;
  };
}
