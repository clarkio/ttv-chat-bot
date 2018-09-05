const server = require('./server')
const bot = require('./bot');
const chat = require('./chat');

server.start();
bot.createNewBotConversation();
chat.connect();
