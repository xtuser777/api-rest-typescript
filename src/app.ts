import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import city from './routes/city';
import state from './routes/state';
import level from './routes/level';
import employee from './routes/employee';
import parameterization from './routes/parameterization';
import token from './routes/token';
import type from './routes/type';
import driver from './routes/driver';
import proprietary from './routes/proprietary';
import person from './routes/person';
import contact from './routes/contact';
import truck from './routes/truck';
import client from './routes/client';
import crypt from './routes/crypt';
import representation from './routes/representation';
import product from './routes/product';
import paymentForm from './routes/payment-form';
import saleBudget from './routes/sale-budget';

class App {
  private app: express.Express;

  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
  }

  listen = (port: number): void => {
    this.app.listen(port, 'localhost');
  };

  private middlewares() {
    // this.app.use(Cors(corsOptions));
    // this.app.use(Helmet());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    //this.app.use(express.static(resolve(__dirname, 'uploads')));
  }

  private routes() {
    this.app.use('/state', state);
    this.app.use('/city', city);
    this.app.use('/level', level);
    this.app.use('/employee', employee);
    this.app.use('/parameterization', parameterization);
    this.app.use('/token', token);
    this.app.use('/type', type);
    this.app.use('/driver', driver);
    this.app.use('/proprietary', proprietary);
    this.app.use('/person', person);
    this.app.use('/contact', contact);
    this.app.use('/truck', truck);
    this.app.use('/client', client);
    this.app.use('/crypt', crypt);
    this.app.use('/representation', representation);
    this.app.use('/product', product);
    this.app.use('/payment-form', paymentForm);
    this.app.use('/sale-budget', saleBudget);
  }
}

export default App;
