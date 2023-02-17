import App from './app';

const port = process.env.APP_PORT;

const app = new App();

if (port) app.listen(Number.parseInt(port));
