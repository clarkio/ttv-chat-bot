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
  log(
    'log',
    'Unable to retrieve configuration from a file. Falling back to environment variables'
  );
  fileConfig = {};
}

const {
  PORT,
  AZURE_BOT_ENABLED,
  TTV_CLIENT_ID,
  TTV_CLIENT_TOKEN,
  TTV_CLIENT_USERNAME,
  TTV_CHANNELS,
  CHAT_COMMANDS,
  SPECIAL_EFFECTS_CHAT_COMMANDS,
  AZURE_BOT_TOKEN,
  DISCORD_HOOK_ENABLED,
  DISCORD_HOOK_ID,
  DISCORD_HOOK_TOKEN,
  STREAM_ELEMENTS_JWT
} = process.env;

const requireConfigMessage = 'REQUIRED CONFIGURATION WAS NOT PROVIDED';

export const port: number = PORT || fileConfig.port || 1337;

export const azureBotEnabled: boolean =
  Boolean(AZURE_BOT_ENABLED === 'true') ||
  Boolean(fileConfig.azureBotEnabled === 'true') ||
  false;

export const ttvClientId: string =
  TTV_CLIENT_ID || fileConfig.ttvClientId || requireConfigMessage;

export const ttvClientToken: string =
  TTV_CLIENT_TOKEN || fileConfig.ttvClientToken || requireConfigMessage;

export const ttvClientUsername: string =
  TTV_CLIENT_USERNAME || fileConfig.ttvClientUsername || 'clarkio';

export const ttvChannels: string[] = TTV_CHANNELS ||
  fileConfig.ttvChannels || ['clarkio'];

export const chatCommands: string[] = CHAT_COMMANDS ||
  fileConfig.chatCommands || [requireConfigMessage];

export const specialEffectsChatCommands = SPECIAL_EFFECTS_CHAT_COMMANDS ||
  fileConfig.specialEffectsChatCommands || [requireConfigMessage];

export const azureBotToken: string =
  AZURE_BOT_TOKEN || fileConfig.azureBotToken || requireConfigMessage;

export const discordHookEnabled: boolean =
  Boolean(DISCORD_HOOK_ENABLED === 'true') ||
  Boolean(fileConfig.discordHookEnabled === 'true') ||
  false;

export const discordHookId: string =
  DISCORD_HOOK_ID || fileConfig.discordHookId || requireConfigMessage;

export const discordHookToken: string =
  DISCORD_HOOK_TOKEN || fileConfig.discordHookToken || requireConfigMessage;

export const streamElementsJwt: string =
  STREAM_ELEMENTS_JWT || fileConfig.streamElementsJwt || requireConfigMessage;
