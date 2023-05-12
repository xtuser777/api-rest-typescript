import { Request, Response } from 'express';
import Database from '../util/database';
import { Person } from '../model/person';
import { Contact } from '../model/contact';
import { IndividualPerson } from '../model/individual-person';
import { EnterprisePerson } from '../model/enterprise-person';
import { Address } from '../model/address';
import { City } from '../model/city';
import { State } from '../model/state';

export class PersonController {
  responseBuild = async (person: Person): Promise<any> => {
    if (person instanceof IndividualPerson)
      return this.individualPerson(person as IndividualPerson);

    return this.enterprisePerson(person as EnterprisePerson);
  };

  individualPerson = async (person: IndividualPerson): Promise<any> => {
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];
    const city = (await new City().find({ id: address.getCityId() }))[0];

    return {
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
            state: city.getStateId(),
          },
        },
      },
    };
  };

  enterprisePerson = async (person: EnterprisePerson): Promise<any> => {
    const contact = (await new Contact().find({ id: person.getContactId() }))[0];
    const address = (await new Address().find({ id: contact.getAddressId() }))[0];
    const city = (await new City().find({ id: address.getCityId() }))[0];
    const state = (await new State().find({ id: city.getStateId() }))[0];

    return {
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
            state: city.getStateId(),
          },
        },
      },
    };
  };

  index = (req: Request, res: Response): Response => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('Requisicao sem corpo.');

    if (req.body.verifyCpf) return this.verifyCpf(req, res);
    if (req.body.verifyCnpj) return this.verifyCnpj(req, res);

    return res.json('');
  };

  verifyCpf = (req: Request, res: Response): Response => {
    const cpf = req.body.verifyCpf;

    const valid = new IndividualPerson().isCpf(cpf);

    return res.json(valid);
  };

  verifyCnpj = (req: Request, res: Response): Response => {
    const cnpj = req.body.verifyCnpj;

    const valid = new EnterprisePerson().isCnpj(cnpj);

    return res.json(valid);
  };
}
