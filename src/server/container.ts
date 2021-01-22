import EffectsManager from './effects-manager';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES }from './types';
import TwitchChat from './twitch-chat';
import TextToSpeech from './text-to-speech';
import AppServer from './server';
import StreamElementsAlerts from './streamelements-alerts';


const container = new Container({ defaultScope: "Singleton" });
container.bind<AppServer>(TYPES.AppServer).toSelf();
container.bind<EffectsManager>(TYPES.EffectsManager).toSelf();
container.bind<StreamElementsAlerts>(TYPES.StreamElementsAlerts).toSelf();
container.bind<TwitchChat>(TYPES.TwitchChat).toSelf();
container.bind<TextToSpeech>(TYPES.TextToSpeech).toSelf();

export { container };
