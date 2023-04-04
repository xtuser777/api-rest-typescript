import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  bill?: number;
  initial?: string;
  end?: string;
  filter?: string;
  dueDate?: string;
  comission?: number;
  situation?: number;
  salesman?: number;
  freight?: number;
  saleComissioned?: number;
  orderBy?: string;
}

export class BillPay {
  constructor(
    private id: number = 0,
    private bill: number = 0,
    private date: Date = new Date(),
    private type: number = 0,
    private description: string = '',
    private enterprise: string = '',
    private installment: number = 0,
    private amount: number = 0.0,
    private comission: boolean = false,
    private situation: number = 0,
    private dueDate: Date = new Date(),
    private paymentDate: Date | undefined = undefined,
    private amountPaid: number = 0.0,
    private pendencyId: number = 0,
    private paymentFormId: number = 0,
    private driverId: number = 0,
    private employeeId: number = 0,
    private categoryId: number = 0,
    private freightOrderId: number = 0,
    private salesOrderId: number = 0,
    private userId: number = 0,
  ) {}

  getId = () => this.id;
  getBill = () => this.bill;
  getDate = () => this.date;
  getType = () => this.type;
  getDescription = () => this.description;
  getEntreprise = () => this.enterprise;
  getInstallment = () => this.installment;
  getAmount = () => this.amount;
  getComission = () => this.comission;
  getSituation = () => this.situation;
  getDueDate = () => this.dueDate;
  getPaymentDate = () => this.paymentDate;
  getAmountPaid = () => this.amountPaid;
  getPendencyId = () => this.pendencyId;
  getPaymentFormId = () => this.paymentFormId;
  getDriverId = () => this.driverId;
  getEmployeeId = () => this.employeeId;
  getCategoryId = () => this.categoryId;
  getFreightOrderId = () => this.freightOrderId;
  getSalesOrderId = () => this.salesOrderId;
  getUserId = () => this.userId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.bill <= 0 ||
      this.description.length === 0 ||
      this.enterprise.length === 0 ||
      this.installment <= 0 ||
      this.amount <= 0 ||
      this.situation == 0 ||
      this.categoryId == 0 ||
      this.userId == 0
    )
      return -5;

    const parameters = [
      this.bill,
      this.date,
      this.type,
      this.description,
      this.enterprise,
      this.installment,
      this.amount,
      this.comission,
      this.dueDate,
      this.situation,
      this.driverId,
      this.employeeId,
      this.categoryId,
      this.freightOrderId,
      this.salesOrderId,
      this.userId,
    ];

    const query = new QueryBuilder()
      .insert(
        'conta_pagar',
        `con_pag_conta,con_pag_data,con_pag_tipo,con_pag_descricao,con_pag_empresa,con_pag_parcela,
         con_pag_valor,con_pag_comissao,con_pag_vencimento,con_pag_situacao,mot_id,fun_id,cat_con_pag_id,
         ped_fre_id,ped_ven_id,usu_id`,
        '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  async payOff(
    form: number,
    amount: number,
    date: string,
    situation: number,
    pendency: number,
  ): Promise<number> {
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
      .update('conta_pagar')
      .set(
        'con_pag_valor_pago = ?,con_pag_data_pagamento = ?,con_pag_situacao = ?,con_pag_pendencia = ?,for_pag_id = ?',
      )
      .where('con_pag_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  }

  reversal = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .update('conta_receber')
      .set(
        'con_pag_valor_pago = null,con_pag_data_pagamento = null,con_pag_situacao = 1,con_pag_pendencia = null,for_pag_id = null',
      )
      .where('con_pag_id = ?')
      .build();

    const result = await Database.instance.update(query, [this.id]);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('conta_pagar')
      .where('con_pag_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<BillPay | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('conta_pagar')
      .where('con_pag_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;

    return this.convertRow(rows[0]);
  };

  find = async (fields?: IFields): Promise<BillPay[]> => {
    const bills: BillPay[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('conta_pagar');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`);
        builder = builder.where('con_pag_descricao like ?');
      }

      if (fields.initial && fields.end) {
        parameters.push(fields.initial, fields.end);
        builder =
          parameters.length == 1
            ? builder.where('(con_pag_data >= ? AND con_pag_data <= ?)')
            : builder.and('(con_pag_data >= ? AND con_pag_data <= ?)');
      }

      if (fields.dueDate) {
        parameters.push(fields.dueDate);
        builder =
          parameters.length == 1
            ? builder.where('con_pag_vencimento = ?')
            : builder.and('con_pag_vencimento = ?');
      }

      if (fields.bill) {
        parameters.push(fields.bill);
        builder =
          parameters.length == 1
            ? builder.where('con_pag_conta = ?')
            : builder.and('con_pag_conta = ?');
      }

      if (fields.situation) {
        parameters.push(fields.situation);
        builder =
          parameters.length == 1
            ? builder.where('con_pag_situacao = ?')
            : builder.and('con_pag_situacao = ?');
      }

      if (fields.comission) {
        parameters.push(fields.comission);
        builder =
          parameters.length == 1
            ? builder.where('con_pag_comissao = ?')
            : builder.and('con_pag_comissao = ?');
      }

      if (fields.salesman) {
        parameters.push(fields.salesman);
        builder =
          parameters.length == 1
            ? builder.where('fun_id = ?')
            : builder.and('fun_id = ?');
      }

      if (fields.freight) {
        parameters.push(fields.freight);
        builder =
          parameters.length == 1
            ? builder.where('ped_fre_id = ?')
            : builder.and('ped_fre_id = ?');
      }

      if (fields.saleComissioned) {
        parameters.push(fields.saleComissioned);
        builder =
          parameters.length == 1
            ? builder.where('con_pag_comissao = TRUE AND ped_ven_id = ?')
            : builder.and('con_pag_comissao = TRUE AND ped_ven_id = ?');
      }

      if (fields.orderBy) builder = builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      bills.push(new BillPay().convertRow(row));
    }

    return bills;
  };

  private convertRow = (row: any): BillPay => {
    this.id = row.con_pag_id;
    this.bill = row.con_pag_conta;
    this.date = new Date(row.con_pag_data);
    this.type = row.con_pag_tipo;
    this.description = row.con_pag_descricao;
    this.enterprise = row.con_pag_empresa;
    this.installment = row.con_pag_parcela;
    this.amount = row.con_pag_valor;
    this.comission = row.con_pag_comissao;
    this.situation = row.con_pag_situacao;
    this.dueDate = new Date(row.con_pag_vencimento);
    this.paymentDate = row.con_pag_data_pagamento
      ? new Date(row.con_pag_data_pagamento)
      : undefined;
    this.amountPaid = row.con_pag_valor_pago ? row.con_pag_valor_pago : 0.0;
    this.pendencyId = row.con_pag_pendencia ? row.con_pag_pendencia : 0;
    this.paymentFormId = row.for_pag_id ? row.for_pag_id : 0;
    this.driverId = row.mot_id ? row.mot_id : 0;
    this.employeeId = row.fun_id ? row.fun_id : 0;
    this.categoryId = row.cat_con_pag_id;
    this.freightOrderId = row.ped_fre_id ? row.ped_fre_id : 0;
    this.salesOrderId = row.ped_ven_id ? row.ped_ven_id : 0;
    this.userId = row.usu_id;

    return this;
  };

  getNewBill = async (): Promise<number> => {
    const query = new QueryBuilder()
      .select('MAX(con_pag_conta) AS CONTA')
      .from('conta_pagar')
      .build();

    const result = await Database.instance.select(query);

    const bill = result[0].CONTA ? result[0].CONTA : 0;

    return bill + 1;
  };

  getRelationsByPF = async (form: number): Promise<number> => {
    if (form <= 0) return -5;

    const query = new QueryBuilder()
      .select('COUNT(con_pag_id) as FORMAS')
      .from('conta_pagar')
      .where('for_pag_id = ?')
      .build();

    const result = await Database.instance.select(query, [form]);

    const forms: number = result[0].FORMAS ? result[0].FORMAS : 0;

    return forms;
  };
}
