import { AppServer } from './server';
import { TwitchChat } from './twitch-chat';
import { AlertsManager } from './alerts-manager';
import EffectsManager from './effects-manager';
import * as config from './config';

const effectsManager = new EffectsManager();

const appServer: AppServer = new AppServer(effectsManager);

const alertManager: AlertsManager = new AlertsManager(
  config.streamElementsJwt,
  effectsManager
);
alertManager.listenToEvents();

const twitchChat: TwitchChat = new TwitchChat(effectsManager);
twitchChat.connect();

export { appServer };
