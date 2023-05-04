import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  filter?: string;
  date?: string;
  type?: number;
  orderBy?: string;
}

export class Event {
  constructor(
    private id: number = 0,
    private description: string = '',
    private date: string = '',
    private time: string = '',
    private salesOrderId: number = 0,
    private freightOrderId: number = 0,
    private userId: number = 0,
  ) {}

  getId = () => this.id;
  getDescription = () => this.description;
  getDate = () => this.date;
  getTime = () => this.time;
  getSalesOrderId = () => this.salesOrderId;
  getFreightOrderId = () => this.freightOrderId;
  getUserId = () => this.userId;

  save = async (): Promise<number> => {
    if (this.id != 0 || this.description.length === 0 || !this.userId) return -5;

    const parameters = [
      this.description,
      this.date,
      this.time,
      this.salesOrderId,
      this.freightOrderId,
      this.userId,
    ];

    const query = new QueryBuilder()
      .insert(
        'evento',
        'evt_descricao, evt_data, evt_hora, ped_ven_id, ped_fre_id, usu_id',
        '?,?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder().delete('evento').where('evt_id = ?').build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<Event | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('evento')
      .where('evt_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;

    return this.convertRow(rows[0]);
  };

  find = async (fields?: IFields): Promise<Event[]> => {
    const events: Event[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('evento');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`);
        builder = builder.where('evt_descricao LIKE ?');
      }

      if (fields.date) {
        parameters.push(fields.date);
        builder =
          parameters.length == 1
            ? builder.where('evt_data = ?')
            : builder.and('evt_data = ?');
      }

      if (fields.type) {
        const order = fields.type == 1 ? 'ped_ven_id' : 'ped_fre_id';
        builder =
          parameters.length == 0
            ? builder.where(`${order} IS NOT NULL AND ${order} > 0`)
            : builder.and(`${order} IS NOT NULL AND ${order} > 0`);
      }

      if (fields.orderBy) builder = builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      events.push(new Event().convertRow(row));
    }

    return events;
  };

  private convertRow = (row: any): Event => {
    this.id = row.evt_id;
    this.date = row.evt_data;
    this.time = row.evt_hora;
    this.description = row.evt_descricao;
    this.freightOrderId = row.ped_fre_id ? row.ped_fre_id : 0;
    this.salesOrderId = row.ped_ven_id ? row.ped_ven_id : 0;
    this.userId = row.usu_id;

    return this;
  };
}
