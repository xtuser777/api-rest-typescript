interface IParameters {
  id: number;
  login: string;
  level: number;
}

export class ActiveUser {
  private static instance: ActiveUser | undefined;

  private constructor(
    private id: number = 0,
    private login: string = '',
    private level: number = 0,
  ) {}

  static getInstance = (params?: IParameters) => {
    if (!ActiveUser.instance) {
      if (!params) return undefined;
      ActiveUser.instance = new ActiveUser(params.id, params.login, params.level);
    }

    return ActiveUser.instance;
  };

  getId = () => this.id;
  getLogin = () => this.login;
  getLevel = () => this.level;
}
