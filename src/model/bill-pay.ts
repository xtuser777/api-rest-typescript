import Database from '../util/database';
import QueryBuilder from '../util/QueryBuilder';

interface IFields {
  bill?: number;
  initial?: string;
  end?: string;
  filter?: string;
  dueDate?: string;
  comission?: number;
  situation?: number;
  salesman?: number;
  freight?: number;
  saleComissioned?: number;
  orderBy?: string;
}

export class BillPay {
  constructor(
    private id: number = 0,
    private bill: number = 0,
    private date: Date = new Date(),
    private type: number = 0,
    private description: string = '',
    private enterprise: string = '',
    private installment: number = 0,
    private amount: number = 0.0,
    private comission: boolean = false,
    private situation: number = 0,
    private dueDate: Date = new Date(),
    private paymentDate: Date | undefined = undefined,
    private amountPaid: number = 0.0,
    private pendencyId: number = 0,
    private paymentFormId: number = 0,
    private driverId: number = 0,
    private salesmanId: number = 0,
    private categoryId: number = 0,
    private freightOrderId: number = 0,
    private salesOrderId: number = 0,
    private userId: number = 0,
  ) {}
}
