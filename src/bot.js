require('dotenv').config();
const fetch = require('node-fetch');

const captains = console;
let conversationId;
let conversationToken;
let expiration;
const azureBotToken = process.env.AzureBotToken;

const noop = () => {};
const botEnabled = process.env.BOT_ENABLED.toLocaleLowerCase() === 'true';
const bot = {
  createNewBotConversation: botEnabled ? createNewBotConversation : noop,
  triggerEffect: botEnabled ? triggerEffect : noop,
  sendCommand: botEnabled ? sendCommand : noop
};

module.exports = bot;

function createNewBotConversation() {
  captains.log(`Starting a new bot conversation at: ${new Date()}`);
  startBotConversation().then(result => {
    captains.log('Bot conversaion started');
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
  if (
    message.includes('subscribed') ||
    message.includes('cheered') ||
    message.includes('tipped')
  ) {
    effect = 'trigger new subscriber';
  } else {
    effect = 'trigger new follower';
  }

  if (effect) {
    return sendCommand(effect, userName)
      .then(result => {
        captains.log(
          `Successfully triggered ${effect} command from ${userName}`
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
