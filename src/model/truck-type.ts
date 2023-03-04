import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  id?: number;
  description?: string;
  orderBy?: string;
}

export class TruckType {
  constructor(
    private id: number = 0,
    private description: string = '',
    private axes: number = 0,
    private capacity: number = 0,
  ) {}

  getId = (): number => this.id;
  getDescription = (): string => this.description;
  getAxes = (): number => this.axes;
  getCapacity = (): number => this.capacity;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.description.trim().length == 0 ||
      this.axes <= 0 ||
      this.capacity <= 0
    )
      return -5;

    const parameters = [this.description, this.axes, this.capacity];

    const query = new QueryBuilder()
      .insert(
        'tipo_caminhao',
        'tip_cam_descricao, tip_cam_eixos, tip_cam_capacidade',
        '?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (): Promise<number> => {
    if (
      this.id <= 0 ||
      this.description.trim().length == 0 ||
      this.axes <= 0 ||
      this.capacity <= 0
    )
      return -5;

    const parameters = [this.description, this.axes, this.capacity, this.id];

    const query = new QueryBuilder()
      .update('tipo_caminhao')
      .set('tip_cam_descricao = ?, tip_cam_eixos = ?, tip_cam_capacidade = ?')
      .where('tip_cam_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('tipo_caminhao')
      .where('tip_cam_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  find = async (fields?: IFields): Promise<TruckType[]> => {
    const types: TruckType[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(`tip_cam_id, tip_cam_descricao, tip_cam_eixos, tip_cam_capacidade`)
      .from('tipo_caminhao');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('tip_cam_id = ?');
      }

      if (fields.description) {
        parameters.push(`%${fields.description}%`);
        builder = builder.where('tip_cam_descricao like ?');
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      types.push(
        new TruckType(
          row.tip_cam_id,
          row.tip_cam_descricao,
          row.tip_cam_eixos,
          row.tip_cam_capacidade,
        ),
      );
    }

    return types;
  };

  dependents = async (id: number): Promise<number> => {
    const query = new QueryBuilder()
      .select('count(tip_cam_id) as dependents')
      .from('tipo_caminhao tc')
      .innerJoin('produto_tipo_caminhao ptc')
      .on('ptc.tip_cam_id = tc.tip_cam_id')
      .innerJoin('caminhao cam')
      .on('cam.tip_cam_id = tc.tip_cam_id')
      .where('tc.tip_cam_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);

    const dependents = rows[0].dependents;

    return dependents;
  };
}
