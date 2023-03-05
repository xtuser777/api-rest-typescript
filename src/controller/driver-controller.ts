import Database from '../util/database';
import { Request, Response } from 'express';
import Driver from '../model/driver';
import { IndividualPerson } from '../model/individual-person';
import { Contact } from '../model/contact';
import { Address } from '../model/address';
import { City } from '../model/city';
import { State } from '../model/state';
import { BankData } from '../model/bank-data';

export class DriverController {
  responseBuild = async (driver: Driver): Promise<any> => {
    const person = (
      await new IndividualPerson().find({ id: driver.getPersonId() })
    )[0] as IndividualPerson;
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];
    const city = (await new City().find({ id: address.getCityId() }))[0];
    const state = (await new State().find({ id: city.getStateId() }))[0];
    const bd = (await new BankData().findOne(driver.getBankDataId())) as BankData;

    return {
      id: driver.getId(),
      register: driver.getRegister(),
      cnh: driver.getChn(),
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
      bankData: {
        id: bd.getId(),
        bank: bd.getBank(),
        agency: bd.getAgency(),
        account: bd.getAccount(),
        type: bd.getType(),
      },
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body) return res.status(400).json('Requisicao sem corpo.');

    await Database.instance.open();
    const drivers = await new Driver().find(req.body);

    const response = [];

    for (const driver of drivers) {
      response.push(this.responseBuild(driver));
    }

    await Database.instance.close();

    return res.json(response);
  };

  show = async (req: Request, res: Response): Promise<Response> => {
    if (!req.params.id) return res.status(400).json('Parametro ausente');

    let id = 0;
    try {
      id = Number.parseInt(req.params.id);
    } catch {
      return res.status(400).json('Parametro inválido');
    }

    await Database.instance.open();

    const driver = await new Driver().findOne(id);

    const response = driver ? this.responseBuild(driver) : null;

    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (!req.body || Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');

    const driver = req.body.driver;
    const person = req.body.person;
    const contact = req.body.contact;
    const address = req.body.address;
    const bank = req.body.bank;

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

    const per = await new IndividualPerson(
      0,
      person.name,
      person.rg,
      person.cpf,
      person.birthDate,
      ctt,
    ).save();
    if (per <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (per == -10) return res.status(400).json('erro ao inserir a pessoa.');
      if (per == -5) return res.status(400).json('campos incorretos na pessoa.');
      if (per == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const bd = await new BankData(
      0,
      bank.bank,
      bank.agency,
      bank.account,
      bank.type,
    ).save();
    if (bd <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (bd == -10) return res.status(400).json('erro ao inserir os dados bancarios.');
      if (bd == -5) return res.status(400).json('campos incorretos nos dados bancarios.');
      if (bd == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    const dvr = await new Driver(
      0,
      driver.register,
      driver.cnh,
      driver.person,
      driver.bank,
    ).save();
    if (dvr <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (dvr == -10) return res.status(400).json('erro ao inserir o motorista.');
      if (dvr == -5) return res.status(400).json('campos incorretos no motorista.');
      if (dvr == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }

    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };

  // update = async (req: Request, res: Response): Promise<Response> => {
  //   if (!req.body) return res.status(400).json('requisicao sem corpo.');

  //   if (!req.params.id) return res.status(400).json('Parametro ausente');

  //   let id = 0;

  //   try {
  //     id = Number.parseInt(req.params.id);
  //   } catch (e) {
  //     return res.status(400).json('Parametro inválido');
  //   }

  //   await Database.instance.open();

  //   const type = (await new TruckType().find({ id }))[0];
  //   if (!type) {
  //     await Database.instance.close();
  //     return res.status(400).json('Tipo nao existe.');
  //   }

  //   await Database.instance.beginTransaction();

  //   const tt = await type.update(req.body.type);
  //   if (tt <= 0) {
  //     await Database.instance.rollback();
  //     await Database.instance.close();
  //     if (tt == -5) return res.status(400).json('campos incorretos no tipo de caminhao.');
  //     if (tt == -10)
  //       return res.status(400).json('erro na atualizacao do tipo de caminhao.');
  //     if (tt == -1)
  //       return res.status(400).json('erro ao abrir a conexao com o banco de dados.');
  //   }

  //   await Database.instance.commit();
  //   await Database.instance.close();

  //   return res.json('');
  // };

  // delete = async (req: Request, res: Response): Promise<Response> => {
  //   if (!req.params.id) return res.status(400).json('Parametro ausente');

  //   let id = 0;

  //   try {
  //     id = Number.parseInt(req.params.id);
  //   } catch (e) {
  //     return res.status(400).json('Parametro inválido');
  //   }

  //   await Database.instance.open();

  //   const type = (await new TruckType().find({ id }))[0];

  //   if (!type) {
  //     await Database.instance.close();
  //     return res.status(400).json('Tipo nao existe.');
  //   }

  //   const dep = await type.dependents();
  //   if (dep > 0) {
  //     await Database.instance.close();
  //     return res.status(400).json('Este tipo possui dependents.');
  //   }

  //   await Database.instance.beginTransaction();

  //   const tt = await type.delete();
  //   if (tt <= 0) {
  //     await Database.instance.rollback();
  //     await Database.instance.close();
  //     if (tt == -10) return res.status(400).json('Erro ao remover o tipo de caminhão.');
  //     if (tt == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
  //   }

  //   await Database.instance.commit();
  //   await Database.instance.close();

  //   return res.json('');
  // };
}