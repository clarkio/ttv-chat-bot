const Discord = require('discord.js');

const discordHook = new Discord.WebhookClient(
  process.env.discordHookId,
  process.env.discordHookToken
);

module.exports = discordHook;
