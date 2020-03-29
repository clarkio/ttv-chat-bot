import { AppServer } from './server';
import { TwitchChat } from './twitch-chat';
import { AlertsListener } from './alerts-listener';
import * as config from './config';
import { log, setHook } from './log';
import { index as indexConstants } from './constants';

if (!config.hasLoadedConfigJSON) {
  log('log', indexConstants.logs.configFileReadWarningMessage);
}

const appServer = new AppServer();

setHook(message => {
  if (config.discordHookEnabled) {
    appServer.discordHook
      .send(message)
      .catch(error => log('error', `Discord: ${error}`));
  }
});

const twitchChat = new TwitchChat(appServer.effectsManager);
twitchChat.connect();

const alertManager = new AlertsListener(
  config.streamElementsJwt,
  appServer.effectsManager,
  twitchChat
);
alertManager.listenToEvents();

export { appServer };
