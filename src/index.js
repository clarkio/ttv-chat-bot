const tmi = require('tmi.js');
const fetch = require('node-fetch');
const Discord = require('discord.js');
const crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
app.use(express.static('./'));

// NOTE: it's ussing http to start the server and NOT app
// This is so the socket.io host starts as well
http.listen(port, () => {
  console.log(runningMessage);
});

const channels = process.env.ttvChannels.toString().split(',');
const clientUsername = process.env.clientUsername.toString();
const lightControlCommands = process.env.lightCommands.toString().split(',');

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
  console.log(`${username} has joined the channel`);
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

ttvChatClient.on('chat', function(channel, user, message, self) {
  let userName = user['display-name'] || user['username'];
  console.log(`Here's the raw message from ${userName}: ${message}`);
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

// let hueAuthCode = 'nNs1G8sC';
// let realm;
// let nonce;
// let hueClientAccessToken = process.env.hueClientAccessToken;
// let hueClientRefreshToken = process.env.hueClientRefreshToken;
// initiateHueAuth().then(getHueToken);

// function initiateHueAuth() {
//   return fetch(`https://api.meethue.com/oauth2/token?code=${hueAuthCode}&grant_type=authorization_code`, {
//     method: 'POST',
//     mode: 'cors'
//   }).then(response => {
//     let hueHeader = response.headers.get('www-authenticate');
//     realm = parseHueRealm(hueHeader);
//     nonce = parseHueNonce(hueHeader);
//     return response;
//   });
// }

// function getHueToken() {
//   let digest = createHueDigest();
//   return fetch(`https://api.meethue.com/oauth2/token?code=${hueAuthCode}&grant_type=authorization_code`, {
//     method: 'POST',
//     headers: {
//       Authorization: `Digest ${digest}`
//     },
//     mode: 'cors'
//   }).then(response => {
//     console.log(response);
//   });
// }

// function createHueDigest() {
//   let response = calculateHueDigestResponse();
//   return `username="${hueClientId}", realm="${realm}", nonce="${nonce}", uri="/oauth2/token", response="${response}"`;
// }

// function calculateHueDigestResponse() {
//   let hash1String = `${hueClientId}:${realm}:${hueClientSecret}`;
//   let hash2String = 'POST:/oauth2/token';
//   let hash1 = crypto
//     .createHash('md5')
//     .update(hash1String)
//     .digest('hex');
//   let hash2 = crypto
//     .createHash('md5')
//     .update(hash2String)
//     .digest('hex');
//   return crypto
//     .createHash('md5')
//     .update(hash1 + `:${nonce}:` + hash2)
//     .digest('hex');
// }

// function parseHueRealm(rawHeader) {
//   const realmKey = 'realm="';
//   let realmKeyIndex = rawHeader.indexOf(realmKey);
//   let realmEndIndex = rawHeader.indexOf('",');
//   return rawHeader.substring(realmKeyIndex + realmKey.length, realmEndIndex);
// }

// function parseHueNonce(rawHeader) {
//   const nonceKey = 'nonce="';
//   let nonceKeyIndex = rawHeader.indexOf(nonceKey);
//   let nonceEndIndex = rawHeader.lastIndexOf('"');
//   return rawHeader.substring(nonceKeyIndex + nonceKey.length, nonceEndIndex);
// }
