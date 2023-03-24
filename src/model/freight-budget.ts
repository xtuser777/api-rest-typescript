import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  date?: string;
  filter?: string;
  initial?: string;
  end?: string;
  price?: number;
  client?: number;
  orderBy?: string;
}

export class FreightBudget {
  constructor(
    private id: number = 0,
    private description: string = '',
    private date: Date = new Date(),
    private distance: number = 0,
    private weight: number = 0,
    private value: number = 0,
    private shipping: string = '',
    private validate: Date = new Date(),
    private saleBudgetId: number = 0,
    private representationId: number = 0,
    private clientId: number = 0,
    private truckTypeId: number = 0,
    private cityId: number = 0,
    private userId: number = 0,
  ) {}

  getId = () => this.id;
  getDescription = () => this.description;
  getDate = () => this.date;
  getDistance = () => this.distance;
  getWeight = () => this.weight;
  getValue = () => this.value;
  getShipping = () => this.shipping;
  getValidate = () => this.validate;
  getSaleBudgetId = () => this.saleBudgetId;
  getRepresentationId = () => this.representationId;
  getClientId = () => this.clientId;
  getTruckTypeId = () => this.truckTypeId;
  getCityId = () => this.cityId;
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

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.description.trim().length <= 0 ||
      this.distance <= 0 ||
      this.value <= 0 ||
      this.weight <= 0 ||
      this.cityId == 0 ||
      this.truckTypeId == 0 ||
      this.userId == 0
    )
      return -5;

    const parameters = [
      this.description,
      this.date,
      this.distance,
      this.weight,
      this.value,
      this.shipping,
      this.validate,
      this.saleBudgetId == 0 ? null : this.saleBudgetId,
      this.representationId == 0 ? null : this.representationId,
      this.clientId,
      this.truckTypeId,
      this.cityId,
      this.userId,
    ];

    const query = new QueryBuilder()
      .insert(
        'orcamento_frete',
        ' orc_fre_descricao,orc_fre_data,orc_fre_distancia,orc_fre_peso,orc_fre_valor,orc_fre_entrega,orc_fre_validade,orc_ven_id,rep_id,cli_id,tip_cam_id,cid_id,usu_id',
        '?,?,?,?,?,?,?,?,?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (
      this.id <= 0 ||
      params.description.trim().length <= 0 ||
      params.distance <= 0 ||
      params.value <= 0 ||
      params.weight <= 0 ||
      params.destiny == 0 ||
      params.truckType == 0
    )
      return -5;

    const parameters = [
      params.description,
      params.distance,
      params.weight,
      params.value,
      params.shipping,
      params.validate,
      params.sale == 0 ? null : params.sale,
      params.representation == 0 ? null : params.representation,
      params.client,
      params.truckType,
      params.destiny,
      this.id,
    ];

    const query = new QueryBuilder()
      .update('orcamento_frete')
      .set(
        `orc_fre_descricao = ?,orc_fre_distancia = ?,orc_fre_peso = ?,orc_fre_valor = ?,orc_fre_entrega = ?,
        orc_fre_validade = ?,orc_ven_id = ?,rep_id = ?,cli_id = ?,tip_cam_id = ?,cid_id = ?`,
      )
      .where('orc_fre_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('orcamento_frete')
      .where('orc_fre_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<FreightBudget | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('orcamento_frete')
      .where('orc_fre_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new FreightBudget(
      row.orc_fre_id,
      row.orc_fre_descricao,
      row.orc_fre_data,
      row.orc_fre_distancia,
      row.orc_fre_peso,
      row.orc_fre_valor,
      row.orc_fre_entrega,
      row.orc_fre_validade,
      row.orc_ven_id,
      row.rep_id,
      row.cli_id,
      row.tip_cam_id,
      row.cid_id,
      row.usu_id,
    );
  };

  find = async (fields?: IFields): Promise<FreightBudget[]> => {
    const budgets: FreightBudget[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(
        `o.orc_fre_id, o.orc_fre_descricao, o.orc_fre_data, o.orc_fre_distancia, o.orc_fre_peso,
        o.orc_fre_valor, o.orc_fre_entrega, o.orc_fre_validade,
        o.orc_ven_id, o.rep_id, o.cli_id, o.tip_cam_id, o.cid_id, o.usu_id`,
      )
      .from('orcamento_frete o');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`);
        builder = builder.where('o.orc_fre_descricao like ?');
      }

      if (fields.date) {
        parameters.push(fields.date);
        builder = builder.where('o.orc_fre_data = ?').and('o.orc_fre_data = ?');
      }

      if (fields.initial && fields.end) {
        parameters.push(fields.initial, fields.end);
        builder = builder
          .where('(o.orc_fre_data >= ? and o.orc_fre_data <= ?)')
          .and('(o.orc_fre_data >= ? and o.orc_fre_data <= ?)');
      }

      if (fields.price) {
        parameters.push(fields.price);
        builder = builder.where('o.orc_fre_valor = ?').and('o.orc_fre_valor = ?');
      }

      if (fields.client) {
        parameters.push(fields.client);
        builder = builder.where('o.cli_id = ?').and('o.cli_id = ?');
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      budgets.push(
        new FreightBudget(
          row.orc_fre_id,
          row.orc_fre_descricao,
          row.orc_fre_data,
          row.orc_fre_distancia,
          row.orc_fre_peso,
          row.orc_fre_valor,
          row.orc_fre_entrega,
          row.orc_fre_validade,
          row.orc_ven_id,
          row.rep_id,
          row.cli_id,
          row.tip_cam_id,
          row.cid_id,
          row.usu_id,
        ),
      );
    }

    return budgets;
  };
}
