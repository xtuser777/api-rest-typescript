import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  id?: number;
  filter?: string;
  type?: number;
  proprietary?: number;
  orderBy?: string;
}

export class Truck {
  constructor(
    private id: number = 0,
    private plate: string = '',
    private brand: string = '',
    private model: string = '',
    private color: string = '',
    private manufactureYear: number = 0,
    private modelYear: number = 0,
    private typeId: number = 0,
    private proprietaryId: number = 0,
  ) {}

  getId = () => this.id;
  getPlate = () => this.plate;
  getBrand = () => this.brand;
  getModel = () => this.model;
  getColor = () => this.color;
  getManufactureYear = () => this.manufactureYear;
  getModelYear = () => this.modelYear;
  getTypeId = () => this.typeId;
  getProprietaryId = () => this.proprietaryId;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.plate.length <= 0 ||
      this.brand.length <= 0 ||
      this.model.length <= 0 ||
      this.color.length <= 0 ||
      this.manufactureYear <= 1900 ||
      this.modelYear <= 1900 ||
      this.typeId == 0 ||
      this.proprietaryId == 0
    )
      return -5;

    const parameters = [
      this.plate,
      this.brand,
      this.model,
      this.color,
      this.manufactureYear,
      this.modelYear,
      this.typeId,
      this.proprietaryId,
    ];

    const query = new QueryBuilder()
      .insert(
        'caminhao',
        'cam_placa,cam_marca,cam_modelo,cam_cor,cam_ano_fabricacao,cam_ano_modelo,tip_cam_id,prp_id',
        '?,?,?,?,?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (
      this.id <= 0 ||
      params.plate.length <= 0 ||
      params.brand.length <= 0 ||
      params.model.length <= 0 ||
      params.color.length <= 0 ||
      params.manufactureYear <= 1900 ||
      params.modelYear <= 1900 ||
      params.type == 0 ||
      params.proprietary == 0
    )
      return -5;

    const parameters = [
      params.plate,
      params.brand,
      params.model,
      params.color,
      params.manufactureYear,
      params.modelYear,
      params.type,
      params.proprietary,
      this.id,
    ];

    const query = new QueryBuilder()
      .update('caminhao')
      .set(
        'cam_placa = ?,cam_marca = ?,cam_modelo = ?,cam_cor = ?,cam_ano_fabricacao = ?,cam_ano_modelo = ?,tip_cam_id = ?,prp_id = ?',
      )
      .where('cam_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder().delete('caminhao').where('cam_id = ?').build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<Truck | undefined> => {
    if (id <= 0) return undefined;

    const query = new QueryBuilder()
      .select('*')
      .from('caminhao')
      .where('cam_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);

    if (rows.length == 0) return undefined;

    const row = rows[0];

    return new Truck(
      row.cam_id,
      row.cam_placa,
      row.cam_marca,
      row.cam_modelo,
      row.cam_cor,
      row.cam_ano_fabricacao,
      row.cam_ano_modelo,
      row.tip_cam_id,
      row.prp_id,
    );
  };

  find = async (fields?: IFields): Promise<Truck[]> => {
    const trucks: Truck[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select(
        `tc.tip_cam_id,tc.tip_cam_descricao,tc.tip_cam_eixos,tc.tip_cam_capacidade,
       cm.cam_id,cm.cam_placa,cm.cam_marca,cm.cam_modelo,cm.cam_cor,cm.cam_ano_fabricacao,cm.cam_ano_modelo,cm.prp_id`,
      )
      .from('caminhao cm')
      .innerJoin('tipo_caminhao tc')
      .on('tc.tip_cam_id = cm.tip_cam_id');

    if (fields) {
      if (fields.filter) {
        parameters.push(`%${fields.filter}%`, `%${fields.filter}%`);
        builder = builder.where('cm.cam_marca like ?').or('cm.cam_modelo like ?');
      }

      if (fields.proprietary && fields.type) {
        parameters.push(fields.proprietary, fields.type);
        builder = builder.where('cm.prp_id = ?').and('cm.tip_cam_id = ?');
      }

      if (fields.orderBy) {
        builder = builder.orderBy(fields.orderBy);
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      trucks.push(
        new Truck(
          row.cam_id,
          row.cam_placa,
          row.cam_marca,
          row.cam_modelo,
          row.cam_cor,
          row.cam_ano_fabricacao,
          row.cam_ano_modelo,
          row.tip_cam_id,
          row.prp_id,
        ),
      );
    }

    return trucks;
  };
}
