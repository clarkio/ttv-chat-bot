import express = require('express');
import { Server } from 'http';
import io from 'socket.io';

import { port } from './config';
import { log } from './logger';
import { Overlay } from './overlay';
import { changeLightColor, sendLightEffect } from './routes/lights';
import { scenesRoute } from './routes/scenes';

// import config from './config';
// const config = require('./config');

// const { port } = config;

class App {
  public overlay: Overlay;
  public app: express.Application;
  public io: SocketIO.Server;
  private http: Server;
  constructor() {
    this.app = express();
    this.http = new Server(this.app);
    this.overlay = new Overlay();
    this.io = io(this.http);
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
      let currentColor: string;
      if (this.overlay) {
        currentColor = this.overlay.getCurrentColor();
      } else {
        currentColor = 'blue';
      }
      res.json({ color: currentColor });
    });

    this.app.use('/', router);
  }

  private listen = (): void => {
    const runningMessage = `Overlay server is running on port http://localhost:${port}`;
    this.http.listen(port, () => {
      log('info', runningMessage);
    });
  };
}

export { App };
