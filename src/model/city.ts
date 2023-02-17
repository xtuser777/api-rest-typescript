import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  id?: number;
  name?: string;
  state?: number;
  orderBy?: string;
}

export class City {
  constructor(
    private id: number = 0,
    private name: string = '',
    private stateId: number = 0,
  ) {}

  getId = () => this.id;

  getName = () => this.name;

  getStateId = () => this.stateId;

  find = async (fields?: IFields): Promise<City[]> => {
    const cities: City[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('cidade');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('cid_id = ?');
      }

      if (fields.name) {
        parameters.push(`%${fields.name}%`);
        builder = builder.where('cid_nome LIKE ?');
      }

      if (fields.state) {
        parameters.push(fields.state);
        builder =
          parameters.length == 1
            ? builder.where('est_id = ?')
            : builder.and('est_id = ?');
      }

      if (fields.orderBy) builder = builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      const city = new City();
      city.convert(row);
      cities.push(city);
    }

    return cities;
  };

  private convert = (row: any) => {
    this.id = row.cid_id;
    this.name = row.cid_nome;
    this.stateId = row.est_id;
  };
}
