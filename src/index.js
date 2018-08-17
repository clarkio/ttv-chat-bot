const tmi = require('tmi.js');
const fetch = require('node-fetch');
const Discord = require('discord.js');
require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 1337;
const runningMessage = 'Overlay server is running on port ' + port;

app.use(express.static(__dirname));

console.log('Overlay', process.env.greenscreenOverlayIframe);

// #region site
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/main/greenscreen', (req, res) => {
  res.sendFile(__dirname + '/gs.html');
});

app.get('/main/guest', (req, res) => {
  res.sendFile(__dirname + '/guest.html');
});

app.get('/lights/:color', (req, res) => {
  io.emit('color-change', req.params.color);
  res.send('Done');
});

app.get('/lights/effects/:effect', (req, res) => {
  io.emit('color-effect', req.params.effect);
  res.send('Done');
});

app.get('/bulb/color', (req, res) => {
  res.json({ color: currentBulbColor });
});

app.get('/main/greenscreen/overlay', (req, res) => {
  res.json({ overlayIframe: process.env.greenscreenOverlayIframe });
});

app.get('/main/overlay', (req, res) => {
  res.json({ overlayIframe: process.env.mainOverlayIframe });
});

app.get('/main/guest/overlay', (req, res) => {
  res.json({ overlayIframe: process.env.guestOverlayIframe });
});

// #endregion site

// NOTE: it's using http to start the server and NOT app
// This is so the socket.io host starts as well
http.listen(port, () => {
  console.log(runningMessage);
});

const cannedColors = ['blue', 'red', 'green', 'purple', 'pink', 'yellow', 'orange', 'teal', 'black', 'gray'];
let currentBulbColor = 'blue';

const channels = process.env.ttvChannels.toString().split(',');
const clientUsername = process.env.clientUsername.toString();
const lightControlCommands = process.env.lightCommands.toString().split(',');
const specialEffectCommands = process.env.specialEffectCommands.toString().split(',');

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
let lightCommandUsed = '';

createNewBotConversation();

ttvChatClient.connect();

function pingTtv() {
  ttvChatClient.ping();
}

ttvChatClient.on('join', function(channel, username, self) {
  let date = new Date();
  let rawMinutes = date.getMinutes();
  let rawHours = date.getHours();
  let hours = rawHours < 10 ? '0' + rawHours.toLocaleString() : rawHours.toLocaleString();
  let minutes = rawMinutes < 10 ? '0' + rawMinutes.toLocaleString() : rawMinutes.toLocaleString();
  console.log(`[${hours}:${minutes}] ${username} has JOINED the channel`);

  if (self) {
    console.log('This client joined the channel...');
    // Assume first channel in channels array is 'self' - owner monitoring their own channel
    setTimeout(pingTtv, 30000);
    ttvChatClient
      .mods(channels[0])
      .then(modsFromTwitch => {
        moderators = moderators.concat(modsFromTwitch);
      })
      .catch(error => console.log(`There was an error getting moderators: ${error}`));
  }
});

ttvChatClient.on('part', function(channel, username, self) {
  let date = new Date();
  console.log(`[${date.getHours()}:${date.getMinutes()}] ${username} has LEFT the channel`);
});

ttvChatClient.on('chat', function(channel, user, message, self) {
  let userName = user['display-name'] || user['username'];
  let lowerCaseMessage = message.toLowerCase();

  if (moderators.indexOf(userName.toLowerCase()) > -1 && isLightControlCommand(message)) {
    let logMessage = `Moderator (${userName}) sent a message`;
    logger('info', logMessage);

    if (lowerCaseMessage.includes('enable')) {
      isChatClientEnabled = true;
      logger('info', 'TTV Chat Listener to control the lights has been enabled');
      return;
    } else if (lowerCaseMessage.includes('disable')) {
      isChatClientEnabled = false;
      logger('info', 'TTV Chat Listener to control the lights has been disabled');
      return;
    }
  }

  if (isChatClientEnabled) {
    parseChat(lowerCaseMessage, userName);
  } else {
    logger('info', 'Command was ignored because the TTV Chat Listener is disabled');
  }
});

function isSpecialEffectCommand(message) {
  return specialEffectCommands.some(command => {
    if (message.includes(command)) {
      return true;
    } else {
      return false;
    }
  });
}

function isLightControlCommand(message) {
  return lightControlCommands.some(command => {
    if (message.startsWith(command.toLowerCase())) {
      lightCommandUsed = command;
      return true;
    } else {
      return false;
    }
  });
}

function parseChat(message, userName) {
  if (isLightControlCommand(message)) {
    let commandMessage = message.slice(lightCommandUsed.length);
    if (commandMessage) {
      discordHook.send(`Received a command from ${userName}: ${commandMessage}`);
      if (isSpecialEffectCommand(commandMessage)) {
        triggerSpecialEffect(commandMessage, userName);
      }
      updateOverlay(commandMessage);
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
    if (message.includes('following') || message.includes('subscribed') || message.includes('cheered')) {
      return triggerEffect(message, userName);
    }
  }
}

function triggerSpecialEffect(message) {
  let effect;
  if (message.includes('cop mode')) {
    effect = 'cop mode';
  } else if (message.includes('subscribe')) {
    effect = 'subscribe';
  } else if (message.includes('follow')) {
    effect = 'follow';
  }
  io.emit('color-effect', effect);
}

function updateOverlay(command) {
  cannedColors.forEach(color => {
    if (command.includes(color)) {
      currentBulbColor = color;
      io.emit('color-change', color);
    }
  });
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
  } else if (message.includes('subscribed') || message.includes('cheered')) {
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
