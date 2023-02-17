import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import city from './routes/city';
import state from './routes/state';

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

  middlewares() {
    // this.app.use(Cors(corsOptions));
    // this.app.use(Helmet());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    //this.app.use(express.static(resolve(__dirname, 'uploads')));
  }

  routes() {
    this.app.use('/state', state);
    this.app.use('/city', city);
  }
}

export default App;
