import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';
import { City } from './city';

interface IFields {
  id?: number;
  name?: string;
  orderBy?: string;
}

export class State {
  constructor(
    private id: number = 0,
    private name: string = '',
    private acronym: string = '',
    private cities: City[] = [],
  ) {}

  getId = () => this.id;

  getName = () => this.name;

  getAcronym = () => this.acronym;

  find = async (fields?: IFields): Promise<State[]> => {
    const states: State[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('estado');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('est_id = ?');
      }

      if (fields.name) {
        parameters.push(`%${fields.name}%`);
        builder = builder.where('est_nome LIKE ?');
      }

      if (fields.orderBy) builder = builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      const state = new State();
      state.convert(row);
      states.push(state);
    }

    return states;
  };

  private convert = async (row: any): Promise<void> => {
    this.id = row.est_id;
    this.name = row.est_nome;
    this.acronym = row.est_sigla;
    this.cities = await new City().find({ state: this.id });
  };
}
