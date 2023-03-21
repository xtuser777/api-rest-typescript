import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  order?: number;
  orderBy?: string;
}

export class LoadStep {
  constructor(
    private id: number = 0,
    private order: number = 0,
    private status: number = 0,
    private load: number = 0,
    private representationId: number = 0,
  ) {}

  getId = () => this.id;
  getOrder = () => this.order;
  getStatus = () => this.status;
  getLoad = () => this.load;
  getRepresentationId = () => this.representationId;

  save = async (order: number): Promise<number> => {
    if (
      this.id != 0 ||
      this.order <= 0 ||
      this.status <= 0 ||
      this.load <= 0 ||
      this.representationId <= 0
    )
      return -5;

    const parameters = [order, this.order, this.status, this.load, this.representationId];

    const query = new QueryBuilder()
      .insert(
        'etapa_carregamento',
        'ped_fre_id, eta_car_ordem, eta_car_status, eta_car_carga, rep_id',
        '?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  authorize = async (): Promise<number> => {
    if (this.id) return -5;

    const query = new QueryBuilder()
      .update('etapa_carregamento')
      .set('eta_car_status = 2')
      .where('eta_car_id = ?')
      .build();

    const result = await Database.instance.update(query, [this.id]);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('etapa_carregamento')
      .where('eta_car_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<LoadStep | undefined> => {
    if (id <= 0) return undefined;
    const query = new QueryBuilder()
      .select('*')
      .from('etapa_carregamento')
      .where('eta_car_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);
    if (rows.length == 0) return undefined;
    const row = rows[0];

    return new LoadStep(
      row.eta_car_id,
      row.eta_car_ordem,
      row.eta_car_status,
      row.eta_car_carga,
      row.rep_id,
    );
  };

  find = async (fields?: IFields): Promise<LoadStep[]> => {
    const steps: LoadStep[] = [];
    const parameters = [];

    let builder = new QueryBuilder().select('*').from('etapa_carregamento');

    if (fields) {
      if (fields.order) {
        parameters.push(fields.order);
        builder = builder.where('ped_fre_id = ?').and('ped_fre_id = ?');
      }

      if (fields.orderBy) builder = builder.orderBy(fields.orderBy);
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      steps.push(
        new LoadStep(
          row.eta_car_id,
          row.eta_car_ordem,
          row.eta_car_status,
          row.eta_car_carga,
          row.rep_id,
        ),
      );
    }

    return steps;
  };
}
