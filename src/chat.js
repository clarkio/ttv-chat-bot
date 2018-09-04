const tmi = require('tmi.js');

const server = require('./server');
const bot = require('./bot');
const discordHook = require('./discord');
const logger = require('./logger')(discordHook);
const config = require('./config');

const captains = console;
const channels = config.ttvChannels.toString().split(',');
const clientUsername = config.ttvClientUsername.toString();
const lightControlCommands = config.chatCommands.toString().split(',');
const specialEffectCommands = config.specialEffectsChatCommands
  .toString()
  .split(',');
let moderators = [clientUsername];
let isChatClientEnabled = true;
let lightCommandUsed = '';

module.exports = {
  connect
};

const options = {
  options: {
    clientId: config.ttvClientId,
    debug: true
  },
  connection: {
    reconnect: true
  },
  identity: {
    username: clientUsername,
    password: config.ttvClientToken
  },
  channels
};
// eslint-disable-next-line new-cap
const ttvChatClient = new tmi.client(options);

function connect() {
  discordHook.send('Client is online and running...');
  ttvChatClient.connect();
}

function pingTtv() {
  ttvChatClient.ping();
}

ttvChatClient.on('join', (channel, username, self) => {
  // TODO: refactor this to be it's own function since it's not relative to this function
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

    if (
      lowerCaseMessage.includes('enable') ||
      lowerCaseMessage.includes('disable')
    ) {
      isChatClientEnabled = lowerCaseMessage.includes('enable');
      const state = isChatClientEnabled ? 'enabled' : 'disabled';
      logger(
        'info',
        `TTV Chat Listener to control the lights has been ${state}`
      );
      return;
    }
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
    // viewer attempting to control the overlay/lights
    const commandMessage = message.slice(lightCommandUsed.length).trim();
    discordHook.send(`Received a command from ${userName}: ${commandMessage}`);

    if (isSpecialEffectCommand(commandMessage)) {
      return startSpecialEffects(commandMessage, userName);
    }
    return startColorChange(commandMessage, userName);
    // it is an intended, but not a supported command
  }

  if (isStreamElements(userName) && isSpecialEffectCommand(message)) {
    startSpecialEffects(message, userName);
  }

  return Promise.resolve('there was nothing to do');
}

function startSpecialEffects(message, userName) {
  server.triggerSpecialEffect(message, userName);
  return bot.triggerEffect(message, userName);
}

function startColorChange(commandMessage, userName) {
  server.updateOverlay(commandMessage);
  return bot
    .sendCommand(commandMessage, userName)
    .then(result => {
      logger('info', `Successfully sent the command from ${userName}`);
      return result;
    })
    .catch(error => {
      captains.log(error);
      return error;
    });
}

function isStreamElements(userName) {
  return userName.toLowerCase() === 'streamelements';
}

function isSpecialEffectCommand(message) {
  return specialEffectCommands.some(command => message.includes(command));
}

function isLightControlCommand(message) {
  return lightControlCommands.some(command => {
    const comparison = message.startsWith(command.toLowerCase());
    lightCommandUsed = comparison ? command : '';
    return comparison;
  });
}
