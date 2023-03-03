import { Request, Response } from 'express';
import Database from '../util/database';
import { Parameterization } from '../model/parameterization';
import { EnterprisePerson } from '../model/enterprise-person';
import { Contact } from '../model/contact';
import { Address } from '../model/address';
import { City } from '../model/city';
import { State } from '../model/state';

export class ParameterizationController {
  responseBuild = async (parameterization: Parameterization): Promise<any> => {
    const person = (
      await new EnterprisePerson().find({ id: parameterization.getPersonId() })
    )[0] as EnterprisePerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];
    const city = (await new City().find({ id: address.getCityId() }))[0];
    const state = (await new State().find({ id: city.getStateId() }))[0];

    return {
      id: parameterization.getId(),
      logotype: parameterization.getLogotype(),
      person: {
        id: person.getId(),
        corporateName: person.getCorporateName(),
        fantasyName: person.getFantasyName(),
        cnpj: person.getCnpj(),
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
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const parameterization = await new Parameterization().find();
    const response = parameterization ? await this.responseBuild(parameterization) : null;
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('requisicao sem corpo.');

    const parameterization = req.body.parameterization;
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

    const ctt = await new Contact(
      0,
      contact.phone,
      contact.cellphone,
      contact.email,
      ads,
    ).save();
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

    const per = await new EnterprisePerson(
      0,
      person.corporateName,
      person.fantasyName,
      person.cnpj,
      ctt,
    ).save();
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

    const par = await new Parameterization(1, parameterization.logotype, per).save();
    if (par == -10) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('erro ao inserir a parametrizacao.');
    }
    if (par == -5) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('campos incorretos na parametrizacao.');
    }
    if (par == -1) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('requisicao sem corpo');

    await Database.instance.open();

    const parameterization = (await new Parameterization().find()) as Parameterization;
    const person = (
      await new EnterprisePerson().find({ id: parameterization.getPersonId() })
    )[0] as EnterprisePerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];

    await Database.instance.beginTransaction();

    const ads = await address.update(req.body.address);
    if (ads == -10) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('erro ao atualizar o endereco.');
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

    const ctt = await contact.update(req.body.contact);
    if (ctt == -10) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('erro ao atualizar o contato.');
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

    const per = await person.update(req.body.person);
    if (per == -10) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('erro ao atualizar a pessoa.');
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

    const par = await parameterization.update(req.body.parameterization.logotype);
    if (par == -10) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('erro ao atualizar a parametrizacao.');
    }
    if (par == -5) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('campos incorretos na parametrizacao.');
    }
    if (par == -1) {
      await Database.instance.rollback();
      await Database.instance.close();
      return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
