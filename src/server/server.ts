import bodyParser from 'body-parser';
import { WebhookClient } from 'discord.js';
import express = require('express');
import { Server } from 'http';
import { resolve as resolvePath } from 'path';
import io from 'socket.io';

import * as config from './config';
import { DiscordBot } from './discord-bot';
import { log } from './log';
import { lightsRouter } from './routes/lights';
import { saveCssRoute } from './routes/save-css';
import { scenesRoute } from './routes/scenes';
import EffectsManager from './effects-manager';

/**
 * The base Express Application. This is where most of the other parts of the application
 * will live. This allows for easy enabling and disabling of features within the application
 */
export class AppServer {
  public app: express.Application;
  public io!: SocketIO.Server;
  public discordHook!: WebhookClient;
  public effectsManager = new EffectsManager(this);
  private http!: Server;

  constructor() {
    this.app = express();
    this.configApp();
    this.startDiscordHook();
    this.startOverlay();
    this.defineRoutes();
    this.listen();
  }

  /**
   * Return the Express Application
   */
  public getApp = (): express.Application => this.app;

  /**
   * Create a socket.io server to use for overlay effects
   */
  private startOverlay = () => {
    this.http = new Server(this.app);
    this.io = io(this.http);
  };

  /**
   * Start the Discord Hook used for logging purposes right now
   */
  private startDiscordHook = () => {
    if (config.discordHookEnabled) {
      this.discordHook = new DiscordBot().createDiscordHook();
    }
  };

  /**
   * Configure Express to parse json, setup pug as our html view engine for generating html pages and host the resources
   */
  private configApp(): void {
    this.app.use(bodyParser.json());
    this.app.set('view engine', 'pug');
    this.app.set('views', resolvePath(`${__dirname}`, '../../views'));
    this.app.use('/assets',express.static(resolvePath(`${__dirname}`, '../../assets')));
    this.app.use('/client',express.static(resolvePath(`${__dirname}`, '../../dist/client')));
  }

  /**
   * Define the routes used in the application
   */
  private defineRoutes(): void {
    const router: express.Router = express.Router();
    const { changeLightColor, sendLightEffect } = lightsRouter(this);

    router.get('/scenes', scenesRoute);

    router.post('/save', saveCssRoute);

    router.get('/overlay-colors', (req, res) => {
      res.render('overlay-colors');
    });

    router.get('/lights/:color', changeLightColor);
    router.get('/lights/effects/:effect', sendLightEffect);

    router.get('/bulb/color', (req, res) => {
      res.json({ color: this.effectsManager.getCurrentOverlayColor() });
    });

    this.app.use('/', router);
  }

  /**
   * Start the Node.js server
   */
  private listen = (): void => {
    const runningMessage = `Overlay server is running on port http://localhost:${config.port}`;
    this.http.listen(config.port, () => {
      log('info', runningMessage);
    });
  };
}
