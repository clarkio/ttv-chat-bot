import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { log } from './log';
dotenv.config();

let fileConfig;

try {
  const buffer = readFileSync(resolve(__dirname, '../config.json'));
  fileConfig = JSON.parse(buffer.toString());
} catch (e) {
  log('info', 'There was an error retrieving configuration from a file');
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

export const port: number = PORT || fileConfig.port || 1337;
export const botEnabled = BOT_ENABLED || fileConfig.botEnabled || 'false';
export const ttvClientId =
  TTV_CLIENT_ID ||
  fileConfig.ttvClientId ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';
export const ttvClientToken =
  TTV_CLIENT_TOKEN ||
  fileConfig.ttvClientToken ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';
export const ttvClientUsername =
  TTV_CLIENT_USERNAME || fileConfig.ttvClientUsername || 'clarkio';
export const ttvChannels = TTV_CHANNELS ||
  fileConfig.ttvChannels || ['clarkio'];
export const chatCommands = CHAT_COMMANDS ||
  fileConfig.chatCommands || ['REQUIRED CONFIGURATION WAS NOT PROVIDED'];
export const specialEffectsChatCommands = SPECIAL_EFFECTS_CHAT_COMMANDS ||
  fileConfig.specialEffectsChatCommands || [
    'REQUIRED CONFIGURATION WAS NOT PROVIDED'
  ];
export const azureBotToken =
  AZURE_BOT_TOKEN ||
  fileConfig.azureBotToken ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';
export const discordHookEnabled =
  DISCORD_HOOK_ENABLED || fileConfig.discordHookEnabled || 'false';
export const discordHookId =
  DISCORD_HOOK_ID ||
  fileConfig.discordHookId ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';
export const discordHookToken =
  DISCORD_HOOK_TOKEN ||
  fileConfig.discordHookToken ||
  'REQUIRED CONFIGURATION WAS NOT PROVIDED';

module.exports = {
  azureBotToken,
  botEnabled,
  chatCommands,
  discordHookEnabled,
  discordHookId,
  discordHookToken,
  port,
  specialEffectsChatCommands,
  ttvChannels,
  ttvClientId,
  ttvClientToken,
  ttvClientUsername
};
