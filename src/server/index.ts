import { AppServer } from './server';
import { TwitchChat } from './twitch-chat';
import { AlertsManager } from './alerts-manager';
import EffectsManager from './effects-manager';
import Commander from './commander';
import * as config from './config';

const effectsManager = new EffectsManager();

const appServer: AppServer = new AppServer(effectsManager);

const commander = new Commander(effectsManager);
const twitchChat: TwitchChat = new TwitchChat(effectsManager, commander);
twitchChat.connect();

const alertManager: AlertsManager = new AlertsManager(
  config.streamElementsJwt,
  effectsManager,
  twitchChat
);
alertManager.listenToEvents();

export { appServer };
