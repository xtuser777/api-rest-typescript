import { Certificate } from 'crypto';
import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  date?: string;
  initial?: string;
  end?: string;
  filter?: string;
  client?: number;
  order?: string;
}

export class SaleBudget {
  constructor(
    private id: number = 0,
    private description: string = '',
    private date: Date = new Date(),
    private clientName: string = '',
    private clientDocument: string = '',
    private clientPhone: string = '',
    private clientCellphone: string = '',
    private clientEmail: string = '',
    private weight: number = 0.0,
    private value: number = 0.0,
    private validate: Date = new Date(),
    private employeeId: number = 0,
    private clientId: number = 0,
    private cityId: number = 0,
    private userId: number = 0,
  ) {}

  getId = () => this.id;
  getDescription = () => this.description;
  getDate = () => this.date;
  getClientName = () => this.clientName;
  getClientDocument = () => this.clientDocument;
  getClientPhone = () => this.clientPhone;
  getClientCellphone = () => this.clientCellphone;
  getClientEmail = () => this.clientEmail;
  getWeight = () => this.weight;
  getValue = () => this.value;
  getValidate = () => this.validate;
  getEmployeeId = () => this.employeeId;
  getClientId = () => this.clientId;
  getCityId = () => this.cityId;
  getUserId = () => this.userId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.description.length == 0 ||
      this.clientName.length == 0 ||
      this.clientDocument.length == 0 ||
      this.clientPhone.length == 0 ||
      this.clientCellphone.length == 0 ||
      this.clientEmail.length == 0 ||
      this.value <= 0 ||
      this.weight <= 0 ||
      this.cityId == 0 ||
      this.userId == 0
    )
      return -5;

    const parameters = [
      this.description,
      this.date,
      this.clientName,
      this.clientDocument,
      this.clientPhone,
      this.clientCellphone,
      this.clientEmail,
      this.weight,
      this.value,
      this.validate,
      this.employeeId,
      this.clientId,
      this.cityId,
      this.userId,
    ];

    const query = new QueryBuilder()
      .insert(
        'orcamento_venda',
        `orc_ven_descricao,orc_ven_data,orc_ven_nome_cliente,orc_ven_documento_cliente,
        orc_ven_telefone_cliente,orc_ven_celular_cliente,orc_ven_email_cliente,orc_ven_peso,orc_ven_valor,
        orc_ven_validade,
        fun_id,cli_id,cid_id,usu_id`,
        '?,?,?,?,?,?,?,?,?,?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (
      this.id <= 0 ||
      params.description.length == 0 ||
      params.clientName.length == 0 ||
      params.clientDocument.length == 0 ||
      params.clientPhone.length == 0 ||
      params.clientCellphone.length == 0 ||
      params.clientEmail.length == 0 ||
      params.value <= 0 ||
      params.weight <= 0 ||
      params.destiny == 0
    )
      return -5;

    const parameters = [
      params.description,
      params.clientName,
      params.clientDocument,
      params.clientPhone,
      params.clientCellphone,
      params.clientEmail,
      params.weight,
      params.value,
      params.validate,
      params.salesman == 0 ? null : params.salesman,
      params.client == 0 ? null : params.client,
      params.destiny,
      this.id,
    ];

    const query = new QueryBuilder()
      .update('orcamento_venda')
      .set(
        `orc_ven_descricao = ?,orc_ven_nome_cliente = ?,orc_ven_documento_cliente = ?,
        orc_ven_telefone_cliente = ?,orc_ven_celular_cliente = ?,orc_ven_email_cliente = ?,orc_ven_peso = ?,
        orc_ven_valor = ?,orc_ven_validade = ?,fun_id = ?,cli_id = ?,cid_id = ?`,
      )
      .where('orc_ven_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('orcamento_venda')
      .where('orc_ven_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<SaleBudget | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('orcamento_venda')
      .where('orc_ven_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new SaleBudget(
      row.orc_ven_id,
      row.orc_ven_descricao,
      row.orc_ven_data,
      row.orc_ven_nome_cliente,
      row.orc_ven_documento_cliente,
      row.orc_ven_telefone_cliente,
      row.orc_ven_celular_cliente,
      row.orc_ven_email_cliente,
      row.orc_ven_peso,
      row.orc_ven_valor,
      row.orc_ven_validade,
      row.fun_id,
      row.cli_id,
      row.cid_id,
      row.usu_id,
    );
  };

  find = async (fields?: IFields): Promise<SaleBudget[]> => {
    const budgets: SaleBudget[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(
        `orc_ven_id,orc_ven_descricao,orc_ven_data,
        orc_ven_nome_cliente,orc_ven_documento_cliente,orc_ven_telefone_cliente,orc_ven_celular_cliente,orc_ven_email_cliente,
        orc_ven_peso,orc_ven_valor,orc_ven_validade,
        fun_id,cli_id,cid_id,usu_id`,
      )
      .from('orcamento_venda');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`, `%${fields.filter}%`);
        builder = builder
          .where('(orc_ven_descricao like ? or orc_ven_nome_cliente like ?)')
          .and('(orc_ven_descricao like ? or orc_ven_nome_cliente like ?)');
      }

      if (fields.date) {
        parameters.push(fields.date);
        builder = builder.where('orc_ven_data = ?').and('orc_ven_data = ?');
      }

      if (fields.initial && fields.end) {
        parameters.push(fields.initial, fields.end);
        builder = builder
          .where('(orc_ven_data >= ? and orc_ven_data <= ?)')
          .and('(orc_ven_data >= ? and orc_ven_data <= ?)');
      }

      if (fields.client) {
        parameters.push(fields.client);
        builder = builder.where('cli_id = ?').and('cli_id = ?');
      }

      if (fields.order) {
        builder = builder.orderBy(fields.order);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      budgets.push(
        new SaleBudget(
          row.orc_ven_id,
          row.orc_ven_descricao,
          row.orc_ven_data,
          row.orc_ven_nome_cliente,
          row.orc_ven_documento_cliente,
          row.orc_ven_telefone_cliente,
          row.orc_ven_celular_cliente,
          row.orc_ven_email_cliente,
          row.orc_ven_peso,
          row.orc_ven_valor,
          row.orc_ven_validade,
          row.fun_id,
          row.cli_id,
          row.cid_id,
          row.usu_id,
        ),
      );
    }

    return budgets;
  };
}
