import EffectsManager from './effects-manager';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES }from './types';
import TwitchChat from './twitch-chat';
import TextToSpeech from './text-to-speech';
import AppServer from './server';


const container = new Container();
container.bind<EffectsManager>(TYPES.EffectsManager).to(EffectsManager);
container.bind<TwitchChat>(TYPES.TwitchChat).to(TwitchChat);
container.bind<TextToSpeech>(TYPES.TextToSpeech).to(TextToSpeech);
container.bind<AppServer>(TYPES.AppServer).to(AppServer).inSingletonScope();

export { container };
