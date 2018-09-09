import { Application } from 'express';
import { App } from './server';
import { TwitchChat } from './twitchChat';

const bot = require('./bot');
// const chat = require('./chat');

const app: App = new App();
const twitchChat: TwitchChat = new TwitchChat();
bot.createNewBotConversation();
// chat.connect();
twitchChat.connect();

export { app };
