import bodyParser from 'body-parser';
import io from 'socket.io';
import express from 'express';
import helmet from 'helmet';
import { Server } from 'http';
import { resolve as resolvePath } from 'path';

import * as config from './config';
import { log } from './log';
import { lightsRouter } from './routes/lights';
import { saveCssRoute } from './routes/save-css';
import { scenesRoute } from './routes/scenes';
import { tokensRoute } from './routes/tokens';
import { injectable } from 'inversify';

/**
 * The base Express Application. This is where most of the other parts of the application
 * will live. This allows for easy enabling and disabling of features within the application
 */
@injectable()
export default class AppServer {
  public app: express.Application;
  private http?: Server;

  constructor() {
    // deepcode ignore UseCsurfForExpress: no forms being used for the API at this time 12/15/2021
    this.app = express();
    this.app.use(helmet());
    this.configApp();
    this.defineRoutes();
  }

  public setSocket(socketServer: io.Server) {
    this.app.use((req, res, next) => {
      req.socketServer = socketServer;
      return next();
    });
  }

  /**
   * Return the Express Application
   */
  public getApp = (): express.Application => this.app;

  /**
   * Create a socket.io server to use for overlay effects
   */
  public startServer = () => {
    this.http = new Server(this.app);
    this.listen();
    return this.http;
  };

  /**
   * Configure Express to parse json, setup pug as our html view engine for generating html pages and host the client resources
   */
  private configApp(): void {
    this.app.use(bodyParser.json());
    this.app.set('view engine', 'pug');
    this.app.set('views', resolvePath(`${__dirname}`, '../../views'));
    this.app.use(
      '/assets',
      express.static(resolvePath(`${__dirname}`, '../../assets'))
    );
    this.app.use(
      '/client',
      express.static(resolvePath(`${__dirname}`, '../../dist/client'))
    );
  }

  /**
   * Define the routes used in the application
   */
  private defineRoutes(): void {
    const router: express.Router = express.Router();
    const { changeLightColor, sendLightEffect } = lightsRouter();

    router.get('/scenes', scenesRoute);
    router.get('/tokens', tokensRoute);
    router.post('/save', saveCssRoute);

    router.get('/overlay-colors', (req, res) => {
      res.render('overlay-colors');
    });

    router.get('/lights/:color', changeLightColor);
    router.get('/lights/effects/:effect', sendLightEffect);

    // TODO: after refactoring for IoC and DI, make sure to restore the ability to determine the current overlay color
    router.get('/bulb/color', (req, res) => {
      // res.json({ color: this.effectsManager.getCurrentOverlayColor() });
      res.json({ color: 'deepskyblue' });
    });

    this.app.use('/', router);
  }

  /**
   * Start the Node.js server
   */
  private listen = (): void => {
    if (!this.http) {
      log('warn', 'The http server has not been set up');
    }

    const runningMessage = `App server is running on port http://localhost:${config.port}`;
    this.http!.listen(config.port, () => {
      log('info', runningMessage);
    });
  };
}
