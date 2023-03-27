import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  date?: string; //
  initial?: string; //
  end?: string; //
  filter?: string; //
  due?: string; //
  comission?: number; //
  representation?: number; //
  situation?: number; //
  freight?: number;
  sale?: number;
  saleComissioned?: number;
  order?: string;
}

export class ReceiveBill {
  constructor(
    private id: number = 0,
    private date: Date = new Date(),
    private bill: number = 0,
    private description: string = '',
    private payer: string = '',
    private amount: number = 0,
    private comission: boolean = false,
    private situation: number = 0,
    private dueDate: Date = new Date(),
    private receiveDate: Date | undefined = undefined,
    private amountReceived: number = 0,
    private pendencyId: number = 0,
    private paymentFormId: number = 0,
    private representationId: number = 0,
    private salesOrderId: number = 0,
    private freightOrderId: number = 0,
    private userId: number = 0,
  ) {}

  getId = () => this.id;
  getDate = () => this.date;
  getBill = () => this.bill;
  getDescription = () => this.description;
  getPayer = () => this.payer;
  getAmount = () => this.amount;
  getComission = () => this.comission;
  getSituation = () => this.situation;
  getDueDate = () => this.dueDate;
  getReceiveDate = () => this.receiveDate;
  getAmountReceived = () => this.amountReceived;
  getPendencyId = () => this.pendencyId;
  getPaymentFormId = () => this.paymentFormId;
  getRepresentationId = () => this.representationId;
  getSalesOrderId = () => this.salesOrderId;
  getFreightOrderId = () => this.freightOrderId;
  getUserId = () => this.userId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.bill <= 0 ||
      this.description.length === 0 ||
      this.payer.length === 0 ||
      this.amount <= 0 ||
      this.situation <= 0 ||
      this.userId == 0
    )
      return -5;

    const parameters = [
      this.bill,
      this.date,
      this.description,
      this.payer,
      this.amount,
      this.comission,
      this.situation,
      this.dueDate,
      this.representationId,
      this.salesOrderId,
      this.freightOrderId,
      this.userId,
    ];

    const query = new QueryBuilder()
      .insert(
        'conta_receber',
        `con_rec_conta,con_rec_data,con_rec_descricao,con_rec_pagador,con_rec_valor,con_rec_comissao,
         con_rec_situacao,con_rec_vencimento,rep_id,ped_ven_id,ped_fre_id,usu_id`,
        '?,?,?,?,?,?,?,?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  receive = async (
    form: number,
    amount: number,
    date: string,
    situation: number,
    pendency: number,
  ): Promise<number> => {
    if (this.id <= 0 || amount <= 0 || date.length === 0 || situation === 0 || form === 0)
      return -5;

    const parameters = [
      amount,
      date,
      situation,
      pendency > 0 ? pendency : null,
      form,
      this.id,
    ];

    const query = new QueryBuilder()
      .update('conta_receber')
      .set(
        'con_rec_valor_recebido = ?,con_rec_data_recebimento = ?,con_rec_situacao = ?,con_rec_pendencia = ?,for_pag_id = ?',
      )
      .where('con_rec_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  reversal = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .update('conta_receber')
      .set(
        'con_rec_valor_recebido = null,con_rec_data_recebimento = null,con_rec_situacao = 1,con_rec_pendencia = null,for_pag_id = null',
      )
      .where('con_rec_id = ?')
      .build();

    const result = await Database.instance.update(query, [this.id]);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('conta_receber')
      .where('con_rec_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<ReceiveBill | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('conta_receber')
      .where('con_rec_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;

    return await this.convertRow(rows[0]);
  };

  find = async (fields?: IFields): Promise<ReceiveBill[]> => {
    const bills: ReceiveBill[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('conta_receber');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`);
        builder = builder.where('con_rec_descricao like ?');
      }

      if (fields.date) {
        parameters.push(fields.date);
        builder =
          parameters.length == 1
            ? builder.where('con_rec_data = ?')
            : builder.and('con_rec_data = ?');
      }

      if (fields.initial && fields.end) {
        parameters.push(fields.initial, fields.end);
        builder =
          parameters.length == 1
            ? builder.where('(con_rec_data >= ? AND con_rec_data <= ?)')
            : builder.and('(con_rec_data >= ? AND con_rec_data <= ?)');
      }

      if (fields.due) {
        parameters.push(fields.due);
        builder =
          parameters.length == 1
            ? builder.where('con_rec_vencimento = ?')
            : builder.and('con_rec_vencimento = ?');
      }

      if (fields.situation) {
        parameters.push(fields.situation);
        builder =
          parameters.length == 1
            ? builder.where('con_rec_situacao = ?')
            : builder.and('con_rec_situacao = ?');
      }

      if (fields.comission) {
        parameters.push(fields.comission);
        builder =
          parameters.length == 1
            ? builder.where('con_rec_comissao = ?')
            : builder.and('con_rec_comissao = ?');
      }

      if (fields.representation) {
        parameters.push(fields.representation);
        builder =
          parameters.length == 1
            ? builder.where('rep_id = ?')
            : builder.and('rep_id = ?');
      }

      if (fields.freight) {
        parameters.push(fields.freight);
        builder =
          parameters.length == 1
            ? builder.where('ped_fre_id = ?')
            : builder.and('ped_fre_id = ?');
      }

      if (fields.sale) {
        parameters.push(fields.sale);
        builder =
          parameters.length == 1
            ? builder.where('con_rec_comissao = FALSE AND ped_ven_id = ?')
            : builder.and('con_rec_comissao = FALSE AND ped_ven_id = ?');
      }

      if (fields.saleComissioned) {
        parameters.push(fields.saleComissioned);
        builder =
          parameters.length == 1
            ? builder.where(
                'con_rec_comissao = TRUE AND rep_id IS NOT NULL AND ped_ven_id = ?',
              )
            : builder.and(
                'con_rec_comissao = TRUE AND rep_id IS NOT NULL AND ped_ven_id = ?',
              );
      }

      if (fields.order) {
        builder = builder.orderBy(fields.order);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      bills.push(await new ReceiveBill().convertRow(row));
    }

    return bills;
  };

  private convertRow = async (row: any): Promise<ReceiveBill> => {
    this.id = row.con_rec_id;
    this.bill = row.con_rec_conta;
    this.date = new Date(row.con_rec_data);
    this.description = row.con_rec_descricao;
    this.payer = row.con_rec_pagador;
    this.amount = row.con_rec_valor;
    this.comission = row.con_rec_comissao;
    this.situation = row.con_rec_situacao;
    this.dueDate = new Date(row.con_rec_vencimento);
    this.receiveDate = row.con_rec_data_recebimento
      ? new Date(row.con_rec_data_recebimento)
      : undefined;
    this.amountReceived = row.con_rec_valor_recebido ? row.con_rec_valor_recebido : 0.0;
    this.pendencyId = row.con_rec_pendencia ? row.con_rec_pendencia : 0;
    this.paymentFormId = row.for_pag_id ? row.for_pag_id : 0;
    this.representationId = row.rep_id ? row.rep_id : 0;
    this.salesOrderId = row.ped_ven_id ? row.ped_ven_id : 0;
    this.freightOrderId = row.ped_fre_id ? row.ped_fre_id : 0;
    this.userId = row.usu_id;

    return this;
  };

  getNewBill = async (): Promise<number> => {
    const query = new QueryBuilder()
      .select('MAX(con_rec_conta) AS CONTA')
      .from('conta_receber')
      .build();

    const rows = await Database.instance.select(query);

    const count = rows[0].CONTA ? rows[0].CONTA : 0;

    return count + 1;
  };
}
