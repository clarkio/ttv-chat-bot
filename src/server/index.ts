import { AppServer } from './server';
import { TwitchChat } from './twitch-chat';
import { AlertsManager } from './alerts-manager';
import * as config from './config';
import { log, setHook } from './log';

if (!config.hasLoadedConfigJSON) {
  log(
    'log',
    'Unable to retrieve configuration from a file. Falling back to environment variables'
  );
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

const alertManager = new AlertsManager(
  config.streamElementsJwt,
  appServer.effectsManager,
  twitchChat
);
alertManager.listenToEvents();

export { appServer };
