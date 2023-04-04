import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  order?: number;
  status?: number;
  current?: boolean;
  orderBy?: string;
}

export class OrderStatus {
  constructor(
    private statusId: number = 0,
    private date: Date = new Date(),
    private time: Date = new Date(),
    private observation: string = '',
    private current: boolean = false,
    private userId: number = 0,
  ) {}

  getStatusId = () => this.statusId;
  getDate = () => this.date;
  getTime = () => this.time;
  getObservation = () => this.observation;
  getCurrent = () => this.current;
  getUserId = () => this.userId;

  save = async (order: number): Promise<number> => {
    if (order <= 0 || this.statusId <= 0 || this.userId <= 0) return -5;

    const parameters = [
      order,
      this.statusId,
      this.date,
      this.observation,
      this.current,
      this.userId,
    ];

    const query = new QueryBuilder()
      .insert(
        'pedido_frete_status',
        'ped_fre_id, sts_id, ped_fre_sts_data, ped_fre_sts_hora, ped_fre_sts_observacoes, ped_fre_sts_atual, usu_id',
        '?,?,?,CURRENT_TIME(),?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  uncurrent = async (order: number, status: number): Promise<number> => {
    if (order <= 0 || status <= 0) return -5;

    const parameters = [order, status];

    const query = new QueryBuilder()
      .update('pedido_frete_status')
      .set('ped_fre_sts_atual = false')
      .where('ped_fre_id = ?')
      .and('sts_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (order: number): Promise<number> => {
    if (order <= 0) return -5;

    const query = new QueryBuilder()
      .delete('pedido_frete_status')
      .where('ped_fre_id = ?')
      .build();

    const result = await Database.instance.delete(query, [order]);

    return result;
  };

  findOne = async (status: number, order: number): Promise<OrderStatus | undefined> => {
    if (status <= 0 || order <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('pedido_frete_status')
      .where('ped_fre_id = ?')
      .and('sts_id = ?')
      .build();

    const rows = await Database.instance.select(query, [order, status]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new OrderStatus(
      row.sts_id,
      row.ped_fre_sts_data,
      row.ped_fre_sts_hora,
      row.ped_fre_sts_observacoes,
      row.ped_fre_sts_atual,
      row.usu_id,
    );
  };

  find = async (fields?: IFields): Promise<OrderStatus[]> => {
    const statuses: OrderStatus[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('pedido_frete_status ');

    if (fields) {
      if (fields.order) {
        parameters.push(fields.order);
        builder = builder.where('ped_fre_id = ?');
      }

      if (fields.status) {
        parameters.push(fields.status);
        builder =
          parameters.length == 1
            ? builder.where('sts_id = ?')
            : builder.and('sts_id = ?');
      }

      if (fields.current) {
        parameters.push(fields.current);
        builder =
          parameters.length == 1
            ? builder.where('ped_fre_sts_atual = ?')
            : builder.and('ped_fre_sts_atual = ?');
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      statuses.push(
        new OrderStatus(
          row.sts_id,
          row.ped_fre_sts_data,
          row.ped_fre_sts_hora,
          row.ped_fre_sts_observacoes,
          row.ped_fre_sts_atual,
          row.usu_id,
        ),
      );
    }

    return statuses;
  };
}
