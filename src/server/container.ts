import EffectsManager from './effects-manager';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES }from './types';
import TwitchChat from './twitch-chat';
import TextToSpeech from './text-to-speech';
import AppServer from './server';
import StreamElementsAlerts from './streamelements-alerts';


const container = new Container({ defaultScope: "Singleton" });
container.bind<AppServer>(TYPES.AppServer).to(AppServer);
container.bind<EffectsManager>(TYPES.EffectsManager).to(EffectsManager);
container.bind<StreamElementsAlerts>(TYPES.StreamElementsAlerts).to(StreamElementsAlerts);
container.bind<TwitchChat>(TYPES.TwitchChat).to(TwitchChat);
container.bind<TextToSpeech>(TYPES.TextToSpeech).to(TextToSpeech);

export { container };
