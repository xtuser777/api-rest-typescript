import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  id?: number;
}

export class BankData {
  constructor(
    private id: number = 0,
    private bank: string = '',
    private agency: string = '',
    private account: string = '',
    private type: number = 0,
  ) {}

  getId = () => this.id;
  getBank = () => this.bank;
  getAgency = () => this.agency;
  getAccount = () => this.account;
  getType = () => this.type;

  save = async (): Promise<number> => {
    if (
      this.id != 0 ||
      this.bank.trim().length <= 0 ||
      this.agency.trim().length <= 0 ||
      this.account.trim().length <= 0 ||
      this.type <= 0
    )
      return -5;

    const parameters = [this.bank, this.agency, this.account, this.type];

    const query = new QueryBuilder()
      .insert(
        'dados_bancarios',
        'dad_ban_banco, dad_ban_agencia, dad_ban_conta, dad_ban_tipo',
        '?,?,?,?',
      )
      .build();

    const result = await Database.instance.insert(query, parameters);

    return result;
  };

  update = async (params: any): Promise<number> => {
    if (
      this.id <= 0 ||
      params.bank.trim().length <= 0 ||
      params.agency.trim().length <= 0 ||
      params.account.trim().length <= 0 ||
      params.type <= 0
    )
      return -5;

    const parameters = [params.bank, params.agency, params.account, params.type, this.id];

    const query = new QueryBuilder()
      .update('dados_bancarios')
      .set('dad_ban_banco = ?, dad_ban_agencia = ?, dad_ban_conta = ?, dad_ban_tipo = ?')
      .where('dad_ban_id = ?')
      .build();

    const result = await Database.instance.update(query, parameters);

    return result;
  };

  delete = async (): Promise<number> => {
    if (this.id <= 0) return -5;

    const query = new QueryBuilder()
      .delete('dados_bancarios')
      .where('dad_ban_id = ?')
      .build();

    const result = await Database.instance.delete(query, [this.id]);

    return result;
  };

  findOne = async (id: number): Promise<BankData | undefined> => {
    const query = new QueryBuilder()
      .select('dad_ban_id, dad_ban_banco, dad_ban_agencia, dad_ban_conta, dad_ban_tipo')
      .from('dados_bancarios')
      .where('dad_ban_id = ?')
      .build();

    const rows = await Database.instance.select(query, [id]);

    if (rows.length == 0) return undefined;

    const row = rows[0];

    return new BankData(
      row.dad_ban_id,
      row.dad_ban_banco,
      row.dad_ban_agencia,
      row.dad_ban_conta,
      row.dad_ban_tipo,
    );
  };

  find = async (fields?: IFields): Promise<BankData[]> => {
    const datas: BankData[] = [];
    const parameters = [];

    let builder = new QueryBuilder()
      .select('dad_ban_id, dad_ban_banco, dad_ban_agencia, dad_ban_conta, dad_ban_tipo')
      .from('dados_bancarios');

    if (fields) {
      if (fields.id) {
        parameters.push(fields.id);
        builder = builder.where('dad_ban_id = ?');
      }
    }

    const query = builder.build();

    const rows = await Database.instance.select(query, parameters);

    for (const row of rows) {
      datas.push(
        new BankData(
          row.dad_ban_id,
          row.dad_ban_banco,
          row.dad_ban_agencia,
          row.dad_ban_conta,
          row.dad_ban_tipo,
        ),
      );
    }

    return datas;
  };
}
