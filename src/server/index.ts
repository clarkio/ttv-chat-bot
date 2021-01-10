import StreamElementsAlerts from './streamelements-alerts';
import * as config from './config';
import { index as indexConstants } from './constants';
import { log, setHook } from './log';
import AppServer from './server';
import TwitchChat from './twitch-chat';
import { container } from './container';
import { TYPES } from './types';

if (!config.hasLoadedConfigJSON) {
  log('log', indexConstants.logs.configFileReadWarningMessage);
}

const appServer = container.get<AppServer>(TYPES.AppServer);

setHook(message => {
  if (config.discordHookEnabled) {
    appServer.discordHook
      .send(message)
      .catch((error: any) => log('error', `Discord: ${error}`));
  }
});

const twitchChat = container.get<TwitchChat>(TYPES.TwitchChat);
twitchChat.connect();

const streamElementsAlerts = container.get<StreamElementsAlerts>(TYPES.StreamElementsAlerts);
streamElementsAlerts.startListening();

export { appServer };

