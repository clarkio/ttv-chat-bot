import { AppServer } from './server';
import { TwitchChat } from './twitch-chat';
import { AlertsManager } from './alerts-manager';
import Overlay from './overlay';
import EffectsManager from './effects-manager';
import SoundFx from './sound-fx';
import ObsManager from './obs-manager';
import * as config from './config';

const soundFx = new SoundFx();
const overlay = new Overlay(soundFx);
const appServer: AppServer = new AppServer(overlay);
const obsManager = new ObsManager();

const effectsManager = new EffectsManager(soundFx, obsManager);
const alertManager: AlertsManager = new AlertsManager(
  config.streamElementsJwt,
  effectsManager
);
alertManager.listenToEvents();

const twitchChat: TwitchChat = new TwitchChat(effectsManager, soundFx);
twitchChat.connect();

export { appServer };
