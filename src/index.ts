import { App } from './app';
import { TwitchChat } from './twitch-chat';

const app: App = new App();
const twitchChat: TwitchChat = new TwitchChat();
twitchChat.connect();

export { app };
