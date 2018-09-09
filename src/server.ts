import express = require('express');
import { port } from './config';
import { overlay } from './index';
import { Overlay } from './overlay';
import { changeLightColor, sendLightEffect } from './routes/lights';
import { scenesRoute } from './routes/scenes';
// import config from './config';
// const config = require('./config');

// const { port } = config;

class App {
  private app: express.Application;
  private overlay: Overlay;
  constructor() {
    this.app = express();
    this.overlay = overlay;
    this.routes();
    this.config();
    this.listen();
  }

  public getApp(): express.Application {
    return this.app;
  }

  private config(): void {
    this.app.set('view engine', 'pug');
    this.app.set('views', `${__dirname}/views`);
    this.app.use(express.static(__dirname));
  }

  private routes(): void {
    const router: express.Router = express.Router();
    router.get('/scenes', scenesRoute);

    router.get('/overlay-colors', (req, res) => {
      res.render('overlay-colors');
    });

    router.get('/lights/:color', changeLightColor);
    router.get('/lights/effects/:effect', sendLightEffect);

    router.get('/bulb/color', (req, res) => {
      const currentColor: string = this.overlay.getCurrentColor();
      res.json({ color: currentColor });
    });

    this.app.use('/', router);
  }

  private listen = (): void => {
    const runningMessage = `Overlay server is running on port http://localhost:${port}`;
    this.app.listen(port, () => {
      console.log(runningMessage);
    });
  };
}

export { App };
