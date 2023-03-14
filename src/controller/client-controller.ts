import { Request, Response } from 'express';
import Database from '../util/database';
import { Client } from '../model/client';
import { IndividualPerson } from '../model/individual-person';
import { EnterprisePerson } from '../model/enterprise-person';
import { PersonController } from './person-controller';
import { Address } from '../model/address';
import { Contact } from '../model/contact';

export class ClientController {
  responseBuild = async (client: Client): Promise<any> => {
    const person =
      client.getType() == 1
        ? (await new IndividualPerson().find({ id: client.getPersonId() }))[0]
        : (await new EnterprisePerson().find({ id: client.getPersonId() }))[0];

    return {
      id: client.getId(),
      register: client.getRegister(),
      type: client.getType(),
      person: await new PersonController().responseBuild(person),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const clients = await new Client().find(req.body);
    const response = [];
    for (const client of clients) {
      response.push(await this.responseBuild(client));
    }
    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido.');
    }

    await Database.instance.open();
    const client = await new Client().findOne(id);
    const response = !client ? undefined : await this.responseBuild(client);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');

    const client = req.body.client;
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
      address.complement.address.code,
      address.city,
    ).save();
    if (ads <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ads == -10) return res.status(400).json('erro ao inserir o endereco.');
      if (ads == -5) return res.status(400).json('campos incorretos no endereco.');
      if (ads == -1) return res.status(400).json('erro ao conectar no banco de dados.');
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
      if (ctt == -5) return res.status(400).json('campos incorretos no contato.');
      if (ctt == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    const per =
      client.type == 1
        ? await new IndividualPerson(
            0,
            person.name,
            person.rg,
            person.cpf,
            person.birthDate,
            ctt,
          ).save()
        : await new EnterprisePerson(
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
      if (per == -5) return res.status(400).json('campos incorretos na pessoa.');
      if (per == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    const cli = await new Client(0, client.register, client.type, per).save();
    if (cli <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (cli == -10) return res.status(400).json('erro ao inserir o cliente.');
      if (cli == -5) return res.status(400).json('campos incorretos no cliente.');
      if (cli == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido.');
    }

    await Database.instance.open();

    const client = await new Client().findOne(id);
    if (!client) return res.status(400).json('Cliente nao existe.');

    const person = (
      client.getType() == 1
        ? await new IndividualPerson().find({ id: client.getPersonId() })
        : await new EnterprisePerson().find({ id: client.getPersonId() })
    )[0] as IndividualPerson | EnterprisePerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];

    await Database.instance.beginTransaction();

    const ads = await address.update(req.body.address);
    if (ads <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ads == -10) return res.status(400).json('erro ao atualizar o endereco.');
      if (ads == -5) return res.status(400).json('campos incorretos no endereco.');
      if (ads == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    const ctt = await contact.update(req.body.contact);
    if (ctt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ctt == -10) return res.status(400).json('erro ao atualizar o contato.');
      if (ctt == -5) return res.status(400).json('campos incorretos no contato.');
      if (ctt == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    const per = await person.update(req.body.person);
    if (per <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (per == -10) return res.status(400).json('erro ao atualizar a pessoa.');
      if (per == -5) return res.status(400).json('campos incorretos na pessoa.');
      if (per == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('parametro ausente.');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('parametro invalido.');
    }

    await Database.instance.open();

    const client = await new Client().findOne(id);
    if (!client) return res.status(400).json('Cliente nao existe.');

    const person = (
      client.getType() == 1
        ? await new IndividualPerson().find({ id: client.getPersonId() })
        : await new EnterprisePerson().find({ id: client.getPersonId() })
    )[0] as IndividualPerson | EnterprisePerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];

    await Database.instance.beginTransaction();

    const cli = await client.delete();
    if (cli <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (cli == -10) return res.status(400).json('erro ao remover o cliente.');
      if (cli == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    const per = await person.delete();
    if (per <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (per == -10) return res.status(400).json('erro ao remover a pessoa.');
      if (per == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    const ctt = await contact.delete();
    if (ctt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ctt == -10) return res.status(400).json('erro ao remover o contato.');
      if (ctt == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    const ads = await address.delete();
    if (ads <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ads == -10) return res.status(400).json('erro ao remover o endereco.');
      if (ads == -1) return res.status(400).json('erro ao conectar no banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
