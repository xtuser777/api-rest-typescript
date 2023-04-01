import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  date?: string;
  initial?: string;
  end?: string;
  filter?: string;
  client?: number;
  budget?: number;
  orderBy?: string;
}

export class SalesOrder {
  constructor(
    private id: number = 0,
    private date: Date = new Date(),
    private description: string = '',
    private weight: number = 0.0,
    private value: number = 0.0,
    private employeeId: number = 0,
    private cityId: number = 0,
    private budgetId: number = 0,
    private truckTypeId: number = 0,
    private clientId: number = 0,
    private paymentFormId: number = 0,
    private userId: number = 0,
  ) {}

  getId = () => this.id;
  getDate = () => this.date;
  getDescription = () => this.description;
  getWeight = () => this.weight;
  getValue = () => this.value;
  getEmployeeId = () => this.employeeId;
  getCityId = () => this.cityId;
  getBudgetId = () => this.budgetId;
  getTruckTypeId = () => this.truckTypeId;
  getClientId = () => this.clientId;
  getPaymentFormId = () => this.paymentFormId;
  getUserId = () => this.userId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.description.length === 0 ||
      this.weight <= 0 ||
      this.value <= 0 ||
      this.cityId === 0 ||
      this.clientId === 0 ||
      this.paymentFormId === 0 ||
      this.userId === 0
    )
      return -5;

    const parameters = [
      this.date,
      this.description,
      this.weight,
      this.value,
      this.employeeId == 0 ? null : this.employeeId,
      this.cityId,
      this.budgetId == 0 ? null : this.budgetId,
      this.clientId,
      this.paymentFormId,
      this.userId,
    ];

    const query = new QueryBuilder()
      .insert(
        'pedido_venda',
        `ped_ven_data,ped_ven_descricao,ped_ven_peso,ped_ven_valor,
        fun_id,cid_id,orc_ven_id,cli_id,for_pag_id,usu_id`,
        '?,?,?,?,?,?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (
      params.id <= 0 ||
      params.description.length === 0 ||
      params.weight <= 0 ||
      params.value <= 0 ||
      params.destiny === 0 ||
      params.client === 0 ||
      params.form === 0
    )
      return -5;

    const parameters = [
      params.description,
      params.weight,
      params.value,
      params.salesman == 0 ? null : params.salesman,
      params.destiny,
      params.budget == 0 ? null : params.budget,
      params.client,
      params.form,
      this.id,
    ];

    const query = new QueryBuilder()
      .update('pedido_venda')
      .set(
        `ped_ven_descricao = ?,ped_ven_peso = ?,ped_ven_valor = ?,
       fun_id = ?,cid_id = ?,orc_ven_id = ?,cli_id = ?,for_pag_id = ?`,
      )
      .where('ped_ven_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('pedido_venda')
      .where('ped_ven_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<SalesOrder | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('pedido_venda')
      .where('ped_ven_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new SalesOrder(
      row.ped_ven_id,
      row.ped_ven_data,
      row.ped_ven_descricao,
      row.ped_ven_peso,
      row.ped_ven_valor,
      !row.fun_id ? 0 : row.fun_id,
      row.cid_id,
      !row.orc_ven_id ? 0 : row.orc_ven_id,
      row.cli_id,
      row.for_pag_id,
      row.usu_id,
    );
  };

  find = async (fields?: IFields): Promise<SalesOrder[]> => {
    const orders: SalesOrder[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(
        `ped_ven_id, ped_ven_data, ped_ven_descricao, ped_ven_peso, ped_ven_valor,
           pv.fun_id, cid_id, orc_ven_id, pv.cli_id, pv.for_pag_id, pv.usu_id`,
      )
      .from('pedido_venda pv')
      .innerJoin('cliente cli')
      .on('cli.cli_id = pv.cli_id')
      .leftJoin('cliente_pessoa_fisica cpf')
      .on('cpf.cli_id = cli.cli_id')
      .leftJoin('cliente_pessoa_juridica cpj')
      .on('cpj.cli_id = cli.cli_id')
      .leftJoin('pessoa_fisica pf')
      .on('pf.pf_id = cpf.pf_id')
      .leftJoin('pessoa_juridica pj')
      .on('pj.pj_id = cpj.pj_id')
      .innerJoin('usuario autor')
      .on('autor.usu_id = pv.usu_id')
      .innerJoin('funcionario autor_fun')
      .on('autor_fun.fun_id = autor.fun_id')
      .innerJoin('pessoa_fisica autor_pf')
      .on('autor_pf.pf_id = autor_fun.pf_id')
      .innerJoin('forma_pagamento fp')
      .on('fp.for_pag_id = pv.for_pag_id');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`, `%${fields.filter}%`, `%${fields.filter}%`);
        builder = builder
          .where('ped_ven_descricao LIKE ?')
          .or('pf.pf_nome LIKE ?')
          .or('pj.pj_nome_fantasia LIKE ?');
      }

      if (fields.date) {
        parameters.push(fields.date);
        builder = builder.where('ped_ven_data = ?').and('ped_ven_data = ?');
      }

      if (fields.initial && fields.end) {
        parameters.push(fields.initial, fields.end);
        builder = builder
          .where('(ped_ven_data >= ? AND ped_ven_data <= ?)')
          .and('(ped_ven_data >= ? AND ped_ven_data <= ?)');
      }

      if (fields.budget) {
        parameters.push(fields.budget);
        builder = builder.where('pv.orc_ven_id = ?').and('pv.orc_ven_id = ?');
      }

      if (fields.client) {
        parameters.push(fields.client);
        builder = builder.where('cli.cli_id = ?').and('cli.cli_id = ?');
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      orders.push(
        new SalesOrder(
          row.ped_ven_id,
          row.ped_ven_data,
          row.ped_ven_descricao,
          row.ped_ven_peso,
          row.ped_ven_valor,
          !row.fun_id ? 0 : row.fun_id,
          row.cid_id,
          !row.orc_ven_id ? 0 : row.orc_ven_id,
          row.cli_id,
          row.for_pag_id,
          row.usu_id,
        ),
      );
    }

    return orders;
  };
}
