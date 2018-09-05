import express from 'express';
import { Overlay } from './overlay';
// import config from './config';
// const config = require('./config');

// const { port } = config;

class App {
  private app: express.Application;
  private overlay: Overlay;
  constructor() {
    this.app = express();
    this.overlay = new Overlay();
    this.routes();
    this.config();
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
    const router = express.Router();

    router.get('/scenes', (req, res) => {
      const { sceneName } = req.query;
      if (sceneName) {
        res.render(`index`, {
          iframeSrc: process.env[`${sceneName}`]
        });
      } else {
        res.status(400);
      }
    });

    router.get('/overlay-colors', (req, res) => {
      res.render('overlay-colors');
    });

    router.get('/lights/:color', (req, res) => {
      const io = this.overlay.getSocket();
      io.emit('color-change', req.params.color);
      res.send('Done');
    });

    router.get('/lights/effects/:effect', (req, res) => {
      const io = this.overlay.getSocket();
      io.emit('color-effect', req.params.effect);
      res.send('Done');
    });

    router.get('/bulb/color', (req, res) => {
      const currentColor: string = this.overlay.getCurrentColor();
      res.json({ color: currentColor });
    });
  }
}

export { App };
