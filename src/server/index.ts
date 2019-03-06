import { AppServer } from './server';
import { TwitchChat } from './twitch-chat';
import { AlertsManager } from './alerts-manager';
import EffectsManager from './effects-manager';
import SoundFx from './sound-fx';
import * as config from './config';

const appServer: AppServer = new AppServer();

const effectsManager = new EffectsManager();
const soundFx = new SoundFx();
const alertManager: AlertsManager = new AlertsManager(
  config.streamElementsJwt,
  effectsManager
);
alertManager.listenToEvents();

const twitchChat: TwitchChat = new TwitchChat(effectsManager, soundFx);
twitchChat.connect();

export { appServer };
