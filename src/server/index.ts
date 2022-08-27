import { Server as io } from 'socket.io';
import * as config from './config';
import { index as indexConstants } from './constants';
import { log } from './log';
import AppServer from './server';
import TwitchChat from './twitch-chat';
import { container } from './container';
import { TYPES } from './types';
import EffectsService from './effects-service';
import TauAlerts from './tau-alerts';

if (!config.hasLoadedConfigJSON) {
  log('log', indexConstants.logs.configFileReadWarningMessage);
}

const appServer = container.get<AppServer>(TYPES.AppServer);
const httpServer = appServer.startServer();

const socketServer = new io(httpServer);
appServer.setSocket(socketServer);

const effectsService = container.get<EffectsService>(TYPES.EffectsService);
effectsService.setSocketServer(socketServer);
effectsService.initEffectControllers();

const twitchChat = container.get<TwitchChat>(TYPES.TwitchChat);
twitchChat.connect();

const tauAlerts = container.get<TauAlerts>(TYPES.TauAlerts);
tauAlerts.startListening();

export { appServer };

