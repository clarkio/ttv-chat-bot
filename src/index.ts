import { AppServer } from './server';
import { TwitchChat } from './twitch-chat';

const appServer: AppServer = new AppServer();
const twitchChat: TwitchChat = new TwitchChat();
twitchChat.connect();

export { appServer };
