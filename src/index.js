const tmi = require('tmi.js');
const fetch = require('node-fetch');
const Discord = require('discord.js');
require('dotenv').config();

const channels = process.env.ttvChannels.toString().split(',');
const clientUsername = process.env.clientUsername.toString();
const lightControlCommand = process.env.lightCommand;

const options = {
  options: {
    clientId: process.env.TwitchClientId,
    debug: true
  },
  connection: {
    reconnect: true
  },
  identity: {
    username: clientUsername,
    password: process.env.clientToken
  },
  channels: channels
};

const ttvChatClient = new tmi.client(options);
const discordHook = new Discord.WebhookClient(process.env.discordHookId, process.env.discordHookToken);
const logger = require('./logger')(discordHook);
discordHook.send('Client is online and running...');

let conversationId;
let conversationToken;
let expiration;
let azureBotToken = process.env.AzureBotToken;
let moderators = [clientUsername];
let isChatClientEnabled = true;

createNewBotConversation();

ttvChatClient.connect();

ttvChatClient.on('join', function(channel, username, self) {
  console.log(`${username} has joined the channel`);
  if (self) {
    console.log('This client joined the channel...');
    // Assume first channel in channels array is 'self' - owner monitoring their own channel
    ttvChatClient
      .mods(channels[0])
      .then(modsFromTwitch => {
        moderators = moderators.concat(modsFromTwitch);
      })
      .catch(error => console.log(`There was an error getting moderators: ${error}`));
  }
});

ttvChatClient.on('chat', function(channel, user, message, self) {
  let userName = user['display-name'] || user['username'];
  console.log(`Here's the raw message from ${userName}: ${message}`);
  let lowerCaseMessage = message.toLowerCase();

  if (moderators.indexOf(userName.toLowerCase()) > -1 && message.startsWith(lightControlCommand)) {
    let logMessage = `Moderator (${userName}) sent a message`;
    logger('info', logMessage);

    if (lowerCaseMessage.includes('enable light')) {
      isChatClientEnabled = true;
      logger('info', 'TTV Chat Listener to control the lights has been enabled');
      return;
    } else if (lowerCaseMessage.includes('disable light')) {
      isChatClientEnabled = false;
      logger('info', 'TTV Chat Listener to control the lights has been disabled');
      return;
    }
  }

  if (isChatClientEnabled) {
    parseChat(lowerCaseMessage, userName);
  }
});

function parseChat(message, userName) {
  if (message.startsWith(lightControlCommand)) {
    let commandMessage = message.slice(lightControlCommand.length);
    if (commandMessage) {
      discordHook.send(`Received a command from ${userName}: ${commandMessage}`);
      return sendCommand(commandMessage, userName)
        .then(result => {
          logger('info', `Successfully sent the command from ${userName}`);
          return result;
        })
        .catch(error => {
          console.log(error);
          return error;
        });
    }
  } else if (userName.toLowerCase() === 'streamelements') {
    if (message.indexOf('following') > -1 || message.indexOf('subscribed') > -1) {
      return triggerEffect(message, userName);
    }
  }
}

function createNewBotConversation() {
  console.log(`Starting a new bot conversation at: ${new Date()}`);
  startBotConversation().then(result => {
    conversationId = result.conversationId;
    conversationToken = result.token;
    expiration = new Date().getSeconds() + parseInt(result['expires_in']) - 30;
    createTimeout(expiration);
  });
}

function createTimeout(expirationTime) {
  let timeInMilliseconds = expirationTime * 1000;
  setTimeout(createNewBotConversation, timeInMilliseconds);
}

function startBotConversation() {
  let url = 'https://directline.botframework.com/api/conversations';
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${azureBotToken}`
    }
  })
    .then(response => response.json())
    .catch(error => {
      console.log(`There was an error starting a conversation with the bot: ${error}`);
      return error;
    });
}

function sendCommand(commandMessage, user) {
  let fullMessage = { text: commandMessage, from: user };
  let url = `https://directline.botframework.com/api/conversations/${conversationId}/messages`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${conversationToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(fullMessage),
    mode: 'cors'
  })
    .then(response => response)
    .catch(error => {
      console.log(error);
      return error;
    });
}

function triggerEffect(message, userName) {
  let effect;
  if (message.includes('following')) {
    effect = 'trigger new follower';
  } else if (message.includes('subscribed')) {
    effect = 'trigger new subscriber';
  }

  if (effect) {
    return sendCommand(effect, userName)
      .then(result => {
        console.log(`Successfully triggered new follower command from ${userName}`);
        return result;
      })
      .catch(error => {
        console.log(error);
        return error;
      });
  } else {
    console.warn(`Unsupported effect was received in the message: ${message}`);
    return;
  }
}
