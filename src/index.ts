import { Application } from 'express';
import { App } from './server';

const bot = require('./bot');
const chat = require('./chat');

const app: Application = new App().getApp();
bot.createNewBotConversation();
chat.connect();

export { app };
