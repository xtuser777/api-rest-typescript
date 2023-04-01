import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';
import { OrderStatus } from './order-status';

interface IFields {
  filter?: string;
  initial?: string;
  end?: string;
  price?: number;
  budget?: number;
  client?: number;
  status?: number;
  orderBy?: string;
}

export class FreightOrder {
  constructor(
    private id: number = 0,
    private date: Date = new Date(),
    private description: string = '',
    private distance: number = 0,
    private weight: number = 0.0,
    private value: number = 0.0,
    private driverValue: number = 0.0,
    private driverEntry: number = 0.0,
    private shipping: string = '',
    private budgetId: number = 0,
    private salesOrderId: number = 0,
    private representationId: number = 0,
    private clientId: number = 0,
    private cityId: number = 0,
    private truckTypeId: number = 0,
    private proprietaryId: number = 0,
    private driverId: number = 0,
    private truckId: number = 0,
    private statusId: number = 0,
    private paymentFormFreightId: number = 0,
    private paymentFormDriverId: number = 0,
    private userId: number = 0,
  ) {}

  getId = () => this.id;
  getDate = () => this.date;
  getDescription = () => this.description;
  getDistance = () => this.distance;
  getWeight = () => this.weight;
  getValue = () => this.value;
  getDriverValue = () => this.driverValue;
  getDriverEntry = () => this.driverEntry;
  getShipping = () => this.shipping;
  getBudgetId = () => this.budgetId;
  getSalesOrderId = () => this.salesOrderId;
  getRespresentationId = () => this.representationId;
  getClientId = () => this.clientId;
  getCityId = () => this.cityId;
  getTruckTypeId = () => this.truckTypeId;
  getProprietaryId = () => this.proprietaryId;
  getDriverId = () => this.driverId;
  getTruckId = () => this.truckId;
  getStatusId = () => this.statusId;
  getPaymentFormFreightId = () => this.paymentFormFreightId;
  getPaymentFormDriverId = () => this.paymentFormDriverId;
  getUserId = () => this.userId;

  calculateMinimumFloor = (km: number, axes: number): number => {
    let floor = 0.0;

    if (km <= 0.0 || axes <= 0) return floor;

    switch (axes) {
      case 4:
        floor = km * 2.3041;
        break;
      case 5:
        floor = km * 2.7446;
        break;
      case 6:
        floor = km * 3.1938;
        break;
      case 7:
        floor = km * 3.3095;
        break;
      case 9:
        floor = km * 3.6542;
        break;
    }

    return floor;
  };

  getRelationsByPF = async (form: number): Promise<number> => {
    if (form <= 0) return -5;

    const query = new QueryBuilder()
      .select('COUNT(ped_fre_id) as FORMAS')
      .from('pedido_frete')
      .where('for_pag_fre = ?')
      .build();

    const rows = await Database.instance.select(query, [form]);

    return rows[0].FORMAS;
  };

  getRelationsByDPF = async (form: number): Promise<number> => {
    if (form <= 0) return -5;

    const query = new QueryBuilder()
      .select('COUNT(ped_fre_id) as FORMAS')
      .from('pedido_frete')
      .where('for_pag_mot = ?')
      .build();

    const rows = await Database.instance.select(query, [form]);

    return rows[0].FORMAS;
  };

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.description.length === 0 ||
      this.distance <= 0 ||
      this.weight <= 0 ||
      this.value <= 0 ||
      this.driverValue <= 0 ||
      this.shipping.length <= 0 ||
      this.clientId == 0 ||
      this.cityId == 0 ||
      this.truckTypeId == 0 ||
      this.proprietaryId == 0 ||
      this.driverId == 0 ||
      this.truckId == 0 ||
      this.paymentFormFreightId == 0 ||
      this.userId == 0
    )
      return -5;

    const parameters = [
      this.date,
      this.description,
      this.distance,
      this.weight,
      this.value,
      this.driverValue,
      this.driverEntry,
      this.shipping,
      this.budgetId,
      this.salesOrderId,
      this.representationId,
      this.clientId,
      this.cityId,
      this.truckTypeId,
      this.truckId,
      this.proprietaryId,
      this.driverId,
      this.paymentFormFreightId,
      this.paymentFormDriverId,
      this.userId,
    ];

    const query = new QueryBuilder()
      .insert(
        'pedido_frete',
        `ped_fre_data,ped_fre_descricao,ped_fre_distancia,ped_fre_peso,ped_fre_valor,ped_fre_valor_motorista,
         ped_fre_entrada_motorista,ped_fre_entrega,orc_fre_id,ped_ven_id,rep_id,cli_id,cid_id,tip_cam_id,
         cam_id,prp_id,mot_id,for_pag_fre,for_pag_mot,usu_id`,
        '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('pedido_frete')
      .where('ped_fre_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<FreightOrder | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('pedido_frete')
      .where('ped_fre_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;

    return await this.convertRow(rows[0]);
  };

  find = async (fields?: IFields): Promise<FreightOrder[]> => {
    const orders: FreightOrder[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(
        `pfr.ped_fre_id,pfr.ped_fre_data,pfr.ped_fre_descricao,pfr.ped_fre_distancia,pfr.ped_fre_peso,pfr.ped_fre_valor,pfr.ped_fre_valor_motorista,pfr.
      ped_fre_entrada_motorista,pfr.ped_fre_entrega,pfr.orc_fre_id,pfr.ped_ven_id,pfr.rep_id,pfr.cli_id,pfr.cid_id,pfr.tip_cam_id,pfr.
      cam_id,pfr.prp_id,pfr.mot_id,pfr.for_pag_fre,pfr.for_pag_mot,pfr.usu_id`,
      )
      .from('pedido_frete pfr')
      .innerJoin('pedido_frete_status pfs')
      .on('pfr.ped_fre_id = pfs.ped_fre_id')
      .innerJoin('status st')
      .on('pfs.sts_id = st.sts_id');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`);
        builder = builder.where('pfr.ped_fre_descricao LIKE ?');
      }

      if (fields.initial && fields.end) {
        parameters.push(fields.initial, fields.end);
        builder =
          parameters.length == 1
            ? builder.where('(pfr.ped_fre_data >= ? AND pfr.ped_fre_data <= ?)')
            : builder.and('(pfr.ped_fre_data >= ? AND pfr.ped_fre_data <= ?)');
      }

      if (fields.price) {
        parameters.push(fields.price);
        builder =
          parameters.length == 1
            ? builder.where('pfr.ped_fre_valor = ?')
            : builder.and('pfr.ped_fre_valor = ?');
      }

      if (fields.budget) {
        parameters.push(fields.budget);
        builder =
          parameters.length == 1
            ? builder.where('pfr.orc_fre_id = ?')
            : builder.and('pfr.orc_fre_id = ?');
      }

      if (fields.client) {
        parameters.push(fields.client);
        builder =
          parameters.length == 1
            ? builder.where('pfr.cli_id = ?')
            : builder.and('pfr.cli_id = ?');
      }

      if (fields.status) {
        parameters.push(fields.status);
        builder =
          parameters.length == 1
            ? builder.where('st.sts_id = ? AND pfs.ped_fre_sts_atual IS TRUE')
            : builder.and('st.sts_id = ? AND pfs.ped_fre_sts_atual IS TRUE');
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      orders.push(await new FreightOrder().convertRow(row));
    }

    return orders;
  };

  private convertRow = async (row: any): Promise<FreightOrder> => {
    this.id = row.ped_fre_id;
    this.date = new Date(row.ped_fre_data);
    this.description = row.ped_fre_descricao;
    this.distance = row.ped_fre_distancia;
    this.weight = row.ped_fre_peso;
    this.value = row.ped_fre_valor;
    this.driverValue = row.ped_fre_valor_motorista;
    this.driverEntry = row.ped_fre_entrada_motorista;
    this.shipping = row.ped_fre_entrega;
    this.budgetId = row.orc_fre_id ? row.orc_fre_id : 0;
    this.salesOrderId = row.ped_ven_id ? row.ped_ven_id : 0;
    this.representationId = row.rep_id ? row.rep_id : 0;
    this.clientId = row.cli_id;
    this.cityId = row.cid_id;
    this.truckTypeId = row.tip_cam_id;
    this.proprietaryId = row.prp_id;
    this.driverId = row.mot_id;
    this.truckId = row.cam_id;
    this.paymentFormFreightId = row.for_pag_fre;
    this.paymentFormDriverId = row.for_pag_mot ? row.for_pag_fre : 0;
    this.userId = row.usu_id;
    this.statusId = (
      await new OrderStatus().find({ order: this.id, current: true })
    )[0].getStatusId();

    return this;
  };
}
