const Discord = require('discord.js');
const config = require('./config');

const discordHookClient = new Discord.WebhookClient(
  config.discordHookId,
  config.discordHookToken
);

const noop = () => {};
const discordHookEnabled =
  config.discordHookEnabled.toLocaleLowerCase() === 'true';
const discordHook = discordHookEnabled ? discordHookClient : { send: noop };

module.exports = discordHook;
