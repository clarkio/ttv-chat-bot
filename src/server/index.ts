import { AlertsManager } from './alerts-manager';
import * as config from './config';
import { index as indexConstants } from './constants';
import { log, setHook } from './log';
import { AppServer } from './server';
import { TwitchChat } from './twitch-chat';
import { YouTubeChat } from './youtube-chat';

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

const youtubeChat = new YouTubeChat(appServer.effectsManager);
youtubeChat
  .startListening()
  .then(result => {
    log('info', 'Connected to YouTube');
  })
  .catch(error => {
    log('error', 'There was an issue connecting to YouTube');
    log('error', error);
  });

const alertManager = new AlertsManager(
  config.streamElementsJwt,
  appServer.effectsManager,
  twitchChat
);
alertManager.listenToEvents();

export { appServer };
