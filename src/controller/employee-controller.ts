import Database from '../util/database';
import { Employee } from '../model/employee';
import { Request, Response } from 'express';
import { User } from '../model/user';
import { IndividualPerson } from '../model/individual-person';
import { Contact } from '../model/contact';
import { Address } from '../model/address';
import { City } from '../model/city';
import { State } from '../model/state';
import { Level } from '../model/level';

export class EmployeeController {
  responseBuild = async (user: User): Promise<any> => {
    const level = (await new Level().find({ id: user.getLevelId() }))[0];
    const employee = (await new Employee().find({ id: user.getEmployeeId() }))[0];
    const person = (
      await new IndividualPerson().find({ id: employee.getPersonId() })
    )[0] as IndividualPerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];
    const city = (await new City().find({ id: address.getCityId() }))[0];
    const state = (await new State().find({ id: city.getStateId() }))[0];

    return {
      id: user.getId(),
      login: user.getLogin(),
      active: user.isActive(),
      employee: {
        id: employee.getId(),
        type: employee.getType(),
        admission: employee.getAdmission(),
        demission: employee.getDemission(),
        person: {
          id: person.getId(),
          name: person.getName(),
          rg: person.getRg(),
          cpf: person.getCpf(),
          birthDate: person.getBirthDate(),
          contact: {
            id: contact.getId(),
            phone: contact.getPhone(),
            cellphone: contact.getCellphone(),
            email: contact.getEmail(),
            address: {
              id: address.getId(),
              street: address.getStreet(),
              number: address.getNumber(),
              neighborhood: address.getNeighborhood(),
              complement: address.getComplement(),
              code: address.getCode(),
              city: {
                id: city.getId(),
                name: city.getName(),
                state: {
                  id: state.getId(),
                  name: state.getName(),
                  acronym: state.getAcronym(),
                },
              },
            },
          },
        },
      },
      level: {
        id: level.getId(),
        description: level.getDescription(),
      },
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('Requisicao sem corpo.');

    if (req.body.isLastAdmin) return this.isLastAdmin(req, res);
    if (req.body.verifyCpf) return this.verifyCpf(req, res);
    if (req.body.loginCheck) return this.loginCheck(req, res);

    await Database.instance.open();
    const users = await new User().find(req.body);

    const response = [];

    for (const user of users) {
      response.push(await this.responseBuild(user));
    }

    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    const id = Number.parseInt(req.params.id);

    await Database.instance.open();

    const user = (await new User().find({ id }))[0];

    const response = await this.responseBuild(user);

    await Database.instance.close();

    return res.json(response);
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

  store = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('requisicao sem corpo.');
    const user = req.body.user;
    const employee = req.body.employee;
    const person = req.body.person;
    const contact = req.body.contact;
    const address = req.body.address;

    await Database.instance.open();
    await Database.instance.beginTransaction();

    const ads = await new Address(
      0,
      address.street,
      address.number,
      address.neighborhood,
      address.complement,
      address.code,
      address.city,
    ).save();
    if (ads <= 0) {
      if (ads == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao inserir o endereco.');
      }
      if (ads == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos no endereco.');
      }
      if (ads == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    const ctt = await new Contact(
      0,
      contact.phone,
      contact.cellphone,
      contact.email,
      ads,
    ).save();
    if (ctt <= 0) {
      if (ctt == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao inserir o contato.');
      }
      if (ctt == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos no contato.');
      }
      if (ctt == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    const per = await new IndividualPerson(
      0,
      person.name,
      person.rg,
      person.cpf,
      person.birthDate,
      ctt,
    ).save();
    if (per <= 0) {
      if (per == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao inserir a pessoa.');
      }
      if (per == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos na pessoa.');
      }
      if (per == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    const emp = await new Employee(
      0,
      employee.type,
      employee.admission,
      undefined,
      per,
    ).save();
    if (emp <= 0) {
      if (emp == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao inserir o funcionario.');
      }
      if (emp == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos no funcionario.');
      }
      if (emp == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    const usu =
      employee.type == 1
        ? await new User(0, user.login, user.password, '', true, emp, user.level).save()
        : await new User(0, '', '', '', false, emp, user.level).save();
    if (usu <= 0) {
      if (usu == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao inserir o usuario.');
      }
      if (usu == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos no usuario.');
      }
      if (usu == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('requisicao sem corpo.');

    if (req.body.desactivate) return this.desactivate(req, res);

    if (req.body.reactivate) return this.reactivate(req, res);

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

    const ads = await address.update(req.body.address);
    if (ads <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ads == -5) {
        return res.status(400).json('campos incorretos no endereco.');
      }
      if (ads == -10) {
        return res.status(400).json('erro na atualizacao do endereco.');
      }
      if (ads == -1) {
        return res.status(400).json('erro ao abrir a conexao com o banco de dados.');
      }
    }

    const ctt = await contact.update(req.body.contact);
    if (ctt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ctt == -5) {
        return res.status(400).json('campos incorretos no contato.');
      }
      if (ctt == -10) {
        return res.status(400).json('erro na atualizacao do contato.');
      }
      if (ctt == -1) {
        return res.status(400).json('erro ao abrir a conexao com o banco de dados.');
      }
    }

    const per = await person.update(req.body.person);
    if (per <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (per == -5) {
        return res.status(400).json('campos incorretos na pessoa.');
      }
      if (per == -10) {
        return res.status(400).json('erro na atualizacao da pessoa.');
      }
      if (per == -1) {
        return res.status(400).json('erro ao abrir a conexao com o banco de dados.');
      }
    }

    const emp = await employee.update(req.body.employee);
    if (emp <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (emp == -5) {
        return res.status(400).json('campos incorretos no funcionario.');
      }
      if (emp == -10) {
        return res.status(400).json('erro na atualizacao do funcionario.');
      }
      if (emp == -1) {
        return res.status(400).json('erro ao abrir a conexao com o banco de dados.');
      }
    }

    const usr = await user.update(req.body.user);
    if (usr <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (usr == -5) {
        return res.status(400).json('campos incorretos no usuario.');
      }
      if (usr == -10) {
        return res.status(400).json('erro na atualizacao do usuario.');
      }
      if (usr == -1) {
        return res.status(400).json('erro ao abrir a conexao com o banco de dados.');
      }
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
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
    if (usr <= 0) {
      if (usr == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('Erro ao remover o usuário.');
      }
      if (usr == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos no usuário.');
      }
      if (usr == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    const emp = await employee.delete();
    if (emp <= 0) {
      if (emp == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('Erro ao remover o funcionario.');
      }
      if (emp == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos no funcionario.');
      }
      if (emp == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    const per = await person.delete();
    if (per <= 0) {
      if (per == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('Erro ao remover a pessoa.');
      }
      if (per == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos na pessoa.');
      }
      if (per == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    const ctt = await contact.delete();
    if (ctt <= 0) {
      if (ctt == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('Erro ao remover o contato.');
      }
      if (ctt == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos no contato.');
      }
      if (ctt == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
    }

    const ads = await address.delete();
    if (ads <= 0) {
      if (ads == -10) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('Erro ao remover o endereco.');
      }
      if (ads == -5) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('campos incorretos no endereco.');
      }
      if (ads == -1) {
        await Database.instance.rollback();
        await Database.instance.close();
        return res.status(400).json('erro ao conectar ao banco de dados.');
      }
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
