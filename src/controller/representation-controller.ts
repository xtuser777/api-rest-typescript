import { Request, Response } from 'express';
import Database from '../util/database';
import { Representation } from '../model/representation';
import { EnterprisePerson } from '../model/enterprise-person';
import { Contact } from '../model/contact';
import { Address } from '../model/address';
import { City } from '../model/city';
import { State } from '../model/state';

export class RepresentationController {
  responseBuild = async (representation: Representation): Promise<any> => {
    const person = (
      await new EnterprisePerson().find({ id: representation.getId() })
    )[0] as EnterprisePerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];
    const city = (await new City().find({ id: address.getCityId() }))[0];
    const state = (await new State().find({ id: city.getStateId() }))[0];

    return {
      id: representation.getId(),
      register: representation.getRegister(),
      unity: representation.getUnity(),
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
    const representations = await new Representation().find(req.body);
    const response = [];
    for (const representation of representations) {
      response.push(await this.responseBuild(representation));
    }
    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('paramentro ausente.');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('paramentro invalido.');
    }
    await Database.instance.open();
    const representation = await new Representation().findOne(id);
    const response = !representation
      ? undefined
      : await this.responseBuild(representation);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');
    const representation = req.body.representation;
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
      await Database.instance.rollback();
      await Database.instance.close();
      if (ads == -10) return res.status(400).json('erro ao inserir o endereco.');
      if (ads == -5) return res.status(400).json('campos invalidos no endereco.');
      if (ads == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    const ctt = await new Contact(
      0,
      contact.phone,
      contact.cellphone,
      contact.email,
      ads,
    ).save();
    if (ctt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ctt == -10) return res.status(400).json('erro ao inserir o contato.');
      if (ctt == -5) return res.status(400).json('campos invalidos no contato.');
      if (ctt == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    const per = await new EnterprisePerson(
      0,
      person.corporateName,
      person.fantasyName,
      person.cnpj,
      ctt,
    ).save();
    if (per <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (per == -10) return res.status(400).json('erro ao inserir a pessoa.');
      if (per == -5) return res.status(400).json('campos invalidos na pessoa.');
      if (per == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    const rep = await new Representation(
      0,
      representation.register,
      representation.unity,
      per,
    ).save();
    if (rep <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (rep == -10) return res.status(400).json('erro ao inserir a representacao.');
      if (rep == -5) return res.status(400).json('campos invalidos na representacao.');
      if (rep == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('paramentro ausente.');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('paramentro invalido.');
    }
    await Database.instance.open();
    const representation = await new Representation().findOne(id);
    if (!representation) return res.status(400).json('representacao nao existe.');
    const person = (
      await new EnterprisePerson().find({ id: representation.getPersonId() })
    )[0] as EnterprisePerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];
    await Database.instance.beginTransaction();
    const ads = await address.update(req.body.address);
    if (ads <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ads == -10) return res.status(400).json('erro ao atualizar o endereco.');
      if (ads == -5) return res.status(400).json('campos invalidos no endereco.');
      if (ads == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    const ctt = await contact.update(req.body.contact);
    if (ctt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ctt == -10) return res.status(400).json('erro ao atualizar o contato.');
      if (ctt == -5) return res.status(400).json('campos invalidos no contato.');
      if (ctt == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    const per = await person.update(req.body.person);
    if (per <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (per == -10) return res.status(400).json('erro ao atualizar a pessoa.');
      if (per == -5) return res.status(400).json('campos invalidos na pessoa.');
      if (per == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    const rep = await representation.update(req.body.representation);
    if (rep <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (rep == -10) return res.status(400).json('erro ao atualizar a representacao.');
      if (rep == -5) return res.status(400).json('campos invalidos na representacao.');
      if (rep == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('paramentro ausente.');
    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('paramentro invalido.');
    }
    await Database.instance.open();
    const representation = await new Representation().findOne(id);
    if (!representation) return res.status(400).json('representacao nao existe.');
    const person = (
      await new EnterprisePerson().find({ id: representation.getPersonId() })
    )[0] as EnterprisePerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];
    await Database.instance.beginTransaction();
    const rep = await representation.delete();
    if (rep <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (rep == -10) return res.status(400).json('erro ao remover a representacao.');
      if (rep == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    const per = await person.delete();
    if (per <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (per == -10) return res.status(400).json('erro ao remover a pessoa.');
      if (per == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    const ctt = await contact.delete();
    if (ctt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ctt == -10) return res.status(400).json('erro ao remover o contato.');
      if (ctt == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    const ads = await contact.delete();
    if (ads <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ads == -10) return res.status(400).json('erro ao remover o endereco.');
      if (ads == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
