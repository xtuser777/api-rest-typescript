import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  orderBy?: string;
}

export class Status {
  constructor(private id: number = 0, private description: string = '') {}

  getId = () => this.id;
  getDescription = () => this.description;

  findOne = async (id: number): Promise<Status | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('status')
      .where('sts_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new Status(row.sts_id, row.sts_descricao);
  };

  find = async (fields?: IFields): Promise<Status[]> => {
    const statuses: Status[] = [];

    let builder = new QueryBuilder().select('*').from('status');

    if (fields) {
      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query);

    for (const row of rows) {
      statuses.push(new Status(row.sts_id, row.sts_descricao));
    }

    return statuses;
  };
}
