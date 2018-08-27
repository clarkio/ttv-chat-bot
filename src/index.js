const captains = console;
const tmi = require('tmi.js');
const fetch = require('node-fetch');
const Discord = require('discord.js');
const server = require('./server');

server.start();

captains.log(`Overlay ${process.env.greenscreenOverlayIframe}`);

const channels = process.env.ttvChannels.toString().split(',');
const clientUsername = process.env.clientUsername.toString();
const lightControlCommands = process.env.lightCommands.toString().split(',');
const specialEffectCommands = process.env.specialEffectCommands
  .toString()
  .split(',');

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
  channels
};

// eslint-disable-next-line new-cap
const ttvChatClient = new tmi.client(options);
const discordHook = new Discord.WebhookClient(
  process.env.discordHookId,
  process.env.discordHookToken
);
const logger = require('./logger')(discordHook);

discordHook.send('Client is online and running...');

let conversationId;
let conversationToken;
let expiration;
const azureBotToken = process.env.AzureBotToken;
let moderators = [clientUsername];
let isChatClientEnabled = true;
let lightCommandUsed = '';

createNewBotConversation();

// #region chat client code

ttvChatClient.connect();

function pingTtv() {
  ttvChatClient.ping();
}

ttvChatClient.on('join', (channel, username, self) => {
  const date = new Date();
  const rawMinutes = date.getMinutes();
  const rawHours = date.getHours();
  const hours = (rawHours < 10 ? '0' : '') + rawHours.toLocaleString();
  const minutes = (rawMinutes < 10 ? '0' : '') + rawMinutes.toLocaleString();

  captains.log(`[${hours}:${minutes}] ${username} has JOINED the channel`);

  if (self) {
    captains.log('This client joined the channel...');
    // Assume first channel in channels array is 'self' - owner monitoring their own channel
    setTimeout(pingTtv, 30000);
    ttvChatClient
      .mods(channels[0])
      .then(modsFromTwitch => {
        moderators = moderators.concat(modsFromTwitch);
      })
      .catch(error =>
        captains.log(`There was an error getting moderators: ${error}`)
      );
  }
});

ttvChatClient.on('part', (channel, username) => {
  const date = new Date();
  captains.log(
    `[${date.getHours()}:${date.getMinutes()}] ${username} has LEFT the channel`
  );
});

ttvChatClient.on('chat', (channel, user, message /* , self */) => {
  const userName = user['display-name'] || user.username;
  const lowerCaseMessage = message.toLowerCase();

  if (
    moderators.indexOf(userName.toLowerCase()) > -1 &&
    isLightControlCommand(message)
  ) {
    const logMessage = `Moderator (${userName}) sent a message`;
    logger('info', logMessage);

    isChatClientEnabled = lowerCaseMessage.includes('enable');
    const state = isChatClientEnabled ? 'enabled' : 'disabled';
    logger('info', `TTV Chat Listener to control the lights has been ${state}`);
    return;
  }

  if (isChatClientEnabled) {
    parseChat(lowerCaseMessage, userName);
  } else {
    logger(
      'info',
      'Command was ignored because the TTV Chat Listener is disabled'
    );
  }
});

function parseChat(message, userName) {
  if (isLightControlCommand(message)) {
    const commandMessage = message.slice(lightCommandUsed.length);
    if (commandMessage) {
      discordHook.send(
        `Received a command from ${userName}: ${commandMessage}`
      );
      if (isSpecialEffectCommand(commandMessage)) {
        server.triggerSpecialEffect(commandMessage, userName);
      }
      server.updateOverlay(commandMessage);
      return sendCommand(commandMessage, userName)
        .then(result => {
          logger('info', `Successfully sent the command from ${userName}`);
          return result;
        })
        .catch(error => {
          captains.log(error);
          return error;
        });
    }
    // it is a light control command, but not command message
  }

  if (isStreamElements(userName) && iHappyCommand(message)) {
    return triggerEffect(message, userName);
  }

  return Promise.resolve('there was nothing to do');
}

function isStreamElements(userName) {
  return userName.toLowerCase() === 'streamelements';
}

function iHappyCommand(message) {
  return (
    message.includes('following') ||
    message.includes('subscribed') ||
    message.includes('cheered')
  );
}

function isSpecialEffectCommand(message) {
  return specialEffectCommands.some(command => message.includes(command));
}

function isLightControlCommand(message) {
  return lightControlCommands.some(command => {
    lightCommandUsed = message.startsWith(command.toLowerCase());
    return !!lightCommandUsed;
  });
}

// #endregion

// #region overlay update code

// #endregion

// #region bot code

function createNewBotConversation() {
  captains.log(`Starting a new bot conversation at: ${new Date()}`);
  startBotConversation().then(result => {
    // eslint-disable-next-line prefer-destructuring
    conversationId = result.conversationId;
    conversationToken = result.token;
    const expiresIn = parseInt(result.expires_in, 10);
    expiration = new Date().getSeconds() + expiresIn - 30;
    createTimeout(expiration);
  });
}

function createTimeout(expirationTime) {
  const timeInMilliseconds = expirationTime * 1000;
  setTimeout(createNewBotConversation, timeInMilliseconds);
}

function startBotConversation() {
  const url = 'https://directline.botframework.com/api/conversations';
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${azureBotToken}`
    }
  })
    .then(response => response.json())
    .catch(error => {
      captains.log(
        `There was an error starting a conversation with the bot: ${error}`
      );
      return error;
    });
}

function sendCommand(commandMessage, user) {
  const fullMessage = { text: commandMessage, from: user };
  const url = `https://directline.botframework.com/api/conversations/${conversationId}/messages`;
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
      captains.log(error);
      return error;
    });
}

function triggerEffect(message, userName) {
  let effect;
  if (message.includes('following')) {
    effect = 'trigger new follower';
  } else if (message.includes('subscribed') || message.includes('cheered')) {
    effect = 'trigger new subscriber';
  }

  if (effect) {
    return sendCommand(effect, userName)
      .then(result => {
        captains.log(
          `Successfully triggered new follower command from ${userName}`
        );
        return result;
      })
      .catch(error => {
        captains.log(error);
        return error;
      });
  }
  captains.warn(`Unsupported effect was received in the message: ${message}`);
  return Promise.resolve('TODO = put something useful here');
}

// #endregion
