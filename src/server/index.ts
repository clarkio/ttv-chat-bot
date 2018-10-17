import { AppServer } from './server';
import { TwitchChat } from './twitch-chat';
import { AlertsManager } from './alerts-manager';
import * as config from './config';

const appServer: AppServer = new AppServer();

const alertManager: AlertsManager = new AlertsManager(config.streamElementsJwt);
alertManager.listenToEvents();

const twitchChat: TwitchChat = new TwitchChat();
twitchChat.connect();

export { appServer };
