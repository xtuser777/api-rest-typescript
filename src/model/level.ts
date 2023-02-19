import QueryBuilder from '../util/QueryBuilder';
import Database from '../util/database';

interface IFields {
  id?: number;
}

export class Level {
  constructor(private id: number = 0, private description: string = '') {}

  getId = () => this.id;

  getDescription = () => this.description;

  find = async (fields?: IFields): Promise<Level[]> => {
    const levels: Level[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('nivel');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('niv_id = ?');
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      levels.push(new Level(row.niv_id, row.niv_descricao));
    }

    return levels;
  };
}
