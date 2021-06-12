import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import EffectsManager from './effects-manager';
import TwitchChat from './twitch-chat';
import TextToSpeech from './text-to-speech';
import AppServer from './server';
import StreamElementsAlerts from './streamelements-alerts';
import ObsHandler from './obs-handler';
import SoundFxManager from './sound-fx';
import Overlay from './overlay';
import { AzureBot } from './azure-bot';
import TwitchUser from './twitch-user';
import TauAlerts from './tau-alerts';

const container = new Container({ defaultScope: "Singleton" });

container.bind<AppServer>(TYPES.AppServer).to(AppServer);
container.bind<EffectsManager>(TYPES.EffectsManager).to(EffectsManager);
container.bind<StreamElementsAlerts>(TYPES.StreamElementsAlerts).to(StreamElementsAlerts);
container.bind<TauAlerts>(TYPES.TauAlerts).to(TauAlerts);
container.bind<TwitchChat>(TYPES.TwitchChat).to(TwitchChat);
container.bind<TextToSpeech>(TYPES.TextToSpeech).to(TextToSpeech);
container.bind<ObsHandler>(TYPES.ObsHandler).to(ObsHandler);
container.bind<SoundFxManager>(TYPES.SoundFxManager).to(SoundFxManager);
container.bind<Overlay>(TYPES.Overlay).to(Overlay);
container.bind<AzureBot>(TYPES.AzureBot).to(AzureBot);
container.bind<TwitchUser>(TYPES.TwitchUser).to(TwitchUser).inTransientScope();

export { container };
