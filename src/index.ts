import { Application } from 'express';
import { Overlay } from './overlay';
import { App } from './server';

const bot = require('./bot');
const chat = require('./chat');

const app: Application = new App().getApp();
const overlay: Overlay = new Overlay();
bot.createNewBotConversation();
chat.connect();

export { app, overlay };
