import { Request, Response } from 'express';
import Database from '../util/database';
import { PaymentForm } from '../model/payment-form';

export class PaymentFormController {
  responseBuild = (form: PaymentForm) => {
    return {
      id: form.getId(),
      description: form.getDescription(),
      link: form.getLink(),
      deadline: form.getDeadline(),
    };
  };

  index = async (req: Request, res: Response): Promise<Response> => {
    await Database.instance.open();
    const forms = await new PaymentForm().find(req.body);
    const response = [];
    for (const form of forms) response.push(this.responseBuild(form));
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
    const form = await new PaymentForm().findOne(id);
    const response = !form ? undefined : this.responseBuild(form);
    await Database.instance.close();

    return res.json(response);
  };

  store = async (req: Request, res: Response): Promise<Response> => {
    if (Object.keys(req.body).length == 0)
      return res.status(400).json('requisicao sem corpo.');
    const form = req.body.form;
    await Database.instance.open();
    await Database.instance.beginTransaction();
    const frm = await new PaymentForm(
      0,
      form.description,
      form.link,
      form.deadline,
    ).save();
    if (frm <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (frm == -10)
        return res.status(400).json('erro ao inserir a forma de pagamento.');
      if (frm == -5)
        return res.status(400).json('campos incorretos na forma de pagamento.');
      if (frm == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
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
    const form = await new PaymentForm().findOne(id);
    if (!form) return res.status(400).json('forma de pagamento nao exite.');
    await Database.instance.beginTransaction();
    const frm = await form.update(req.body.form);
    if (frm <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (frm == -10)
        return res.status(400).json('erro ao atualizar a forma de pagamento.');
      if (frm == -5)
        return res.status(400).json('campos incorretos na forma de pagamento.');
      if (frm == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
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
    const form = await new PaymentForm().findOne(id);
    if (!form) return res.status(400).json('forma de pagamento nao exite.');
    // colocar validacoes de vínculos depois de concluir pedidos e contas a pagar
    await Database.instance.beginTransaction();
    const frm = await form.delete();
    if (frm <= 0) {
      await Database.instance.rollback();
      await Database.instance.close();
      if (frm == -10)
        return res.status(400).json('erro ao remover a forma de pagamento.');
      if (frm == -5)
        return res.status(400).json('campos incorretos na forma de pagamento.');
      if (frm == -1) return res.status(400).json('erro ao conectar ao banco de dados.');
    }
    await Database.instance.commit();
    await Database.instance.close();

    return res.json('');
  };
}
