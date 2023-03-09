import { Request, Response } from 'express';
import Database from '../util/database';
import Proprietary from '../model/proprietary';
import Driver from '../model/driver';
import { IndividualPerson } from '../model/individual-person';
import { EnterprisePerson } from '../model/enterprise-person';
import { DriverController } from './driver-controller';
import { PersonController } from './person-controller';
import { Address } from '../model/address';
import { Contact } from '../model/contact';

export class ProprietaryController {
  responseBuild = async (prop: Proprietary): Promise<any> => {
    const driver = await new Driver().findOne(prop.getDriverId());
    const person =
      prop.getType() == 1
        ? (await new IndividualPerson().find({ id: prop.getPersonId() }))[0]
        : (await new EnterprisePerson().find({ id: prop.getPersonId() }))[0];

    return {
      id: prop.getId(),
      register: prop.getRegister(),
      type: prop.getType(),
      driver: !driver ? undefined : await new DriverController().responseBuild(driver),
      person: await new PersonController().responseBuild(person),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const props = await new Proprietary().find(req.body);

    const response = [];
    for (const prop of props) {
      response.push(await this.responseBuild(prop));
    }

    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente.');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro incorreto.');
    }

    await Database.instance.open();
    const prop = await new Proprietary().findOne(id);
    const response = !prop ? undefined : await this.responseBuild(prop);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('Requisicao sem corpo.');

    const prop = req.body.prop;
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
      if (ads == -5) return res.status(400).json('campos incorretos no endereco.');
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
      if (ctt == -5) return res.status(400).json('campos incorretos no contato.');
      if (ctt == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const per =
      prop.type == 1
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
      if (per == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const prp = await new Proprietary(
      0,
      prop.register,
      prop.type,
      prop.driver,
      per,
    ).save();
    if (prp < 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (prp == -10) return res.status(400).json('erro ao inserir o proprietario.');
      if (prp == -5) return res.status(400).json('campos incorretos no proprietario.');
      if (prp == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente.');

    if (Object.keys(req.body).length == 0)
      return res.status(400).json('Requisicao sem corpo.');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro incorreto.');
    }

    await Database.instance.open();

    const prop = await new Proprietary().findOne(id);

    if (!prop) return res.status(400).json('Proprietario nao existe.');

    const person = (
      prop.getType() == 1
        ? await new IndividualPerson().find({ id: prop.getPersonId() })
        : await new EnterprisePerson().find({ id: prop.getPersonId() })
    )[0] as IndividualPerson | EnterprisePerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];

    await Database.instance.beginTransaction();

    const ads = await address.update(req.body.address);
    if (ads <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ads == -5) return res.status(400).json('campos incorretos no endereco.');
      if (ads == -10) return res.status(400).json('erro na atualizacao do endereco.');
      if (ads == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const ctt = await contact.update(req.body.contact);
    if (ctt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ctt == -5) return res.status(400).json('campos incorretos no contato.');
      if (ctt == -10) return res.status(400).json('erro na atualizacao do contato.');
      if (ctt == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const per = await person.update(req.body.person);
    if (per <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (per == -5) return res.status(400).json('campos incorretos na pessoa.');
      if (per == -10) return res.status(400).json('erro na atualizacao da pessoa.');
      if (per == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const prp = await prop.update(req.body.prop);
    if (prp <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (prp == -5) return res.status(400).json('campos incorretos no proprietario.');
      if (prp == -10) return res.status(400).json('erro na atualizacao do proprietario.');
      if (prp == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente.');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro invalido.');
    }

    await Database.instance.open();

    const prop = await new Proprietary().findOne(id);

    if (!prop) return res.status(400).json('Proprietario nao existe.');

    const person = (
      prop.getType() == 1
        ? await new IndividualPerson().find({ id: prop.getPersonId() })
        : await new EnterprisePerson().find({ id: prop.getPersonId() })
    )[0] as IndividualPerson | EnterprisePerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];

    await Database.instance.beginTransaction();

    const prp = await prop.delete();
    if (prp <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (prp == -10) return res.status(400).json('erro na remocao do proprietario.');
      if (prp == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const per = await person.delete();
    if (per <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (per == -10) return res.status(400).json('erro na remocao da pessoa.');
      if (per == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const ctt = await contact.delete();
    if (ctt <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ctt == -10) return res.status(400).json('erro na remocao do contato.');
      if (ctt == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const ads = await address.delete();
    if (ads <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (ads == -10) return res.status(400).json('erro na remocao do endereco.');
      if (ads == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
