import Database from '../util/database';
import { Employee } from '../model/employee';
import { Request, Response } from 'express';
import { User } from '../model/user';
import { IndividualPerson } from '../model/individual-person';
import { Contact } from '../model/contact';
import { Address } from '../model/address';

export class EmployeeController {
  index = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('Requisicao sem corpo.');

    if (req.body.isLastAdmin) return this.isLastAdmin(req, res);
    if (req.body.verifyCpf) return this.verifyCpf(req, res);
    if (req.body.loginCheck) return this.loginCheck(req, res);

    await Database.instance.open();
    const users = await new User().find(req.body);
    await Database.instance.close();

    return res.json(users);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    const id = Number.parseInt(req.params.id);

    await Database.instance.open();
    const users = await new User().find({ id });
    await Database.instance.close();

    return res.json(users);
  };

  isLastAdmin = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const count = await new User().adminCount();
    await Database.instance.close();

    console.log(count);

    return res.json(count == 1);
  };

  verifyCpf = (req: Request, res: Response): Response => {
    const cpf = req.body.verifyCpf;

    const valid = new IndividualPerson().isCpf(cpf);

    return res.json(valid);
  };

  loginCheck = async (req: Request, res: Response): Promise<Response> => {
    const login = req.body.loginCheck;

    await Database.instance.open();
    const logins = await new User().loginCount(login);
    await Database.instance.close();

    return res.json(logins);
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    const id = Number.parseInt(req.params.id);

    await Database.instance.open();

    const user = (await new User().find({ id }))[0];
    const employee = (await new Employee().find({ id: user.getEmployeeId() }))[0];
    const person = (
      await new IndividualPerson().find({ id: employee.getPersonId() })
    )[0] as IndividualPerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];

    await Database.instance.beginTransaction();

    const usr = await new User(id).delete();
    if (usr > 0) await Database.instance.commit();
    else {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('Erro ao remover o usuário.');
    }

    const emp = await employee.delete();
    if (emp > 0) await Database.instance.commit();
    else {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('Erro ao remover o funcionário.');
    }

    const per = await person.delete();
    if (per > 0) await Database.instance.commit();
    else {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('Erro ao remover a pessoa.');
    }

    const ctt = await contact.delete();
    if (ctt > 0) await Database.instance.commit();
    else {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('Erro ao remover c contato.');
    }

    const ads = await address.delete();
    if (ads > 0) await Database.instance.commit();
    else {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('Erro ao remover o endereco.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  desactivate = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    await Database.instance.open();
    await Database.instance.beginTransaction();
    const result = await new Employee().desactivate(Number.parseInt(req.params.id));
    if (result > 0) await Database.instance.commit();
    else {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('Erro ao desativar o funcionário.');
    }
    await Database.instance.close();

    return res.json('');
  };

  reactivate = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    await Database.instance.open();
    await Database.instance.beginTransaction();
    const result = await new Employee().reactivate(Number.parseInt(req.params.id));
    if (result > 0) await Database.instance.commit();
    else {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('Erro ao reativar o funcionário.');
    }
    await Database.instance.close();

    return res.json('');
  };
}
