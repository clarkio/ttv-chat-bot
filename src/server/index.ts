import io from 'socket.io';

import StreamElementsAlerts from './streamelements-alerts';
import * as config from './config';
import { index as indexConstants } from './constants';
import { log } from './log';
import AppServer from './server';
import TwitchChat from './twitch-chat';
import { container } from './container';
import { TYPES } from './types';
import EffectsManager from './effects-manager';

if (!config.hasLoadedConfigJSON) {
  log('log', indexConstants.logs.configFileReadWarningMessage);
}

const appServer = container.get<AppServer>(TYPES.AppServer);
const httpServer = appServer.startServer();

const socketServer = io(httpServer);
appServer.setSocket(socketServer);

const effectsManager = container.get<EffectsManager>(TYPES.EffectsManager);
effectsManager.setSocketServer(socketServer);
effectsManager.initEffectControllers();

const twitchChat = container.get<TwitchChat>(TYPES.TwitchChat);
twitchChat.connect();

const streamElementsAlerts = container.get<StreamElementsAlerts>(TYPES.StreamElementsAlerts);
streamElementsAlerts.startListening();

export { appServer };

