const { readFileSync } = require('fs');
const { resolve } = require('path');
require('dotenv').config();

const captains = console;

let fileConfig;

try {
  const buffer = readFileSync(resolve(__dirname, '../config.json'));
  fileConfig = JSON.parse(buffer.toString());
} catch (e) {
  captains.log('There was an error retrieving configuration from a file', e);
  fileConfig = {};
}

const {
  PORT,
  BOT_ENABLED,
  TTV_CLIENT_ID,
  TTV_CLIENT_TOKEN,
  TTV_CLIENT_USERNAME,
  TTV_CHANNELS,
  CHAT_COMMANDS,
  SPECIAL_EFFECTS_CHAT_COMMANDS,
  AZURE_BOT_TOKEN,
  DISCORD_HOOK_ENABLED,
  DISCORD_HOOK_ID,
  DISCORD_HOOK_TOKEN
} = process.env;

const port = PORT || fileConfig.port || 1337;
const botEnabled = BOT_ENABLED || fileConfig.botEnabled || 'false';
const ttvClientId =
  TTV_CLIENT_ID ||
  fileConfig.ttvClientId ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';
const ttvClientToken =
  TTV_CLIENT_TOKEN ||
  fileConfig.ttvClientToken ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';
const ttvClientUsername =
  TTV_CLIENT_USERNAME || fileConfig.ttvClientUsername || 'clarkio';
const ttvChannels = TTV_CHANNELS || fileConfig.ttvChannels || ['clarkio'];
const chatCommands = CHAT_COMMANDS ||
  fileConfig.chatCommands || ['REQUIRED CONFIGURATION WAS NOT PROVIDED'];
const specialEffectsChatCommands = SPECIAL_EFFECTS_CHAT_COMMANDS ||
  fileConfig.specialEffectsChatCommands || [
    'REQUIRED CONFIGURATION WAS NOT PROVIDED'
  ];
const azureBotToken =
  AZURE_BOT_TOKEN ||
  fileConfig.azureBotToken ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';
const discordHookEnabled =
  DISCORD_HOOK_ENABLED || fileConfig.discordHookEnabled || 'false';
const discordHookId =
  DISCORD_HOOK_ID ||
  fileConfig.discordHookId ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';
const discordHookToken =
  DISCORD_HOOK_TOKEN ||
  fileConfig.discordHookToken ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';

module.exports = {
  port,
  botEnabled,
  ttvClientId,
  ttvClientToken,
  ttvClientUsername,
  ttvChannels,
  chatCommands,
  specialEffectsChatCommands,
  azureBotToken,
  discordHookEnabled,
  discordHookId,
  discordHookToken
};
