const tmi = require('tmi.js');
const fetch = require('node-fetch');
require('dotenv').config();

const options = {
  options: {
    clientId: process.env.TwitchClientId,
    debug: true
  },
  connection: {
    reconnect: true
  },
  channels: ['clarkio']
};

const ttvChatClient = new tmi.client(options);

let conversationId;
let conversationToken;
let expiration;
let azureBotToken = process.env.AzureBotToken;

createNewBotConversation();

ttvChatClient.connect();
ttvChatClient.on('chat', function(channel, user, message, self) {
  let userName = user['display-name'] || user['username'];
  console.log(`Here's the raw message ${message} from ${userName}`);

  if (message.startsWith('!bulb')) {
    let commandMessage = message.slice(5);
    if (commandMessage) {
      return sendCommand(commandMessage, userName)
        .then(result => {
          console.log(`Successfully Sent a message from ${userName}`);
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
});

function createNewBotConversation() {
  console.log(`Starting a new bot conversation at: ${new Date()}`);
  startBotConversation().then(result => {
    console.log(`Successfully started a new conversation ${result.conversationId}`);
    conversationId = result.conversationId;
    conversationToken = result.token;
    expiration = new Date().getSeconds() + parseInt(result['expires_in']) - 30;
    createTimeout(expiration);
  });
}

function createTimeout(expirationTime) {
  console.log(`creating a new timeout for ${expirationTime}`);
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
  console.log(`About to send the following command: ${commandMessage}`);
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
  if (message.contains('following')) {
    effect = 'trigger new follower';
  } else if (message.contains('subscribed')) {
    effect = 'trigger new subscriber';
  }

  if (effect) {
    return sendCommand(effect, userName)
      .then(result => {
        console.log(result);
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
