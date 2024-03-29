import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
dotenv.config();

let fileConfig;
export let hasLoadedConfigJSON = false;

try {
  const buffer = readFileSync(resolve(__dirname, '../config.json'));
  fileConfig = JSON.parse(buffer.toString());
  hasLoadedConfigJSON = true;
} catch (e) {
  fileConfig = {};
}

const {
  PORT,
  AZURE_BOT_ENABLED,
  SOUND_FX_ENABLED,
  SCENE_FX_ENABLED,
  TTV_CLIENT_ID,
  TTV_CLIENT_TOKEN,
  TTV_CLIENT_USERNAME,
  TTV_CHANNELS,
  CHAT_COMMAND_PREFIX,
  CHAT_COMMANDS,
  SPECIAL_EFFECTS_CHAT_COMMANDS,
  AZURE_BOT_TOKEN,
  AZURE_BOT_RESPONSE_CHECK_DELAY,
  AZURE_SPEECH_TOKEN,
  DISCORD_HOOK_ENABLED,
  DISCORD_HOOK_ID,
  DISCORD_HOOK_TOKEN,
  OBS_SOCKETS_KEY,
  OBS_SOCKETS_SERVER,
  STREAMELEMENTS_JWT,
  STREAMELEMENTS_WEBSOCKET_URL,
  TAU_TOKEN,
  TAU_URL,
  CAMERA_SHADOW_DURATION_MILLISECONDS,
  CAMERA_SHADOW_FADE_MILLISECONDS,
  CAMERA_SHADOW_OPACITY_MODIFIER,
  ELGATO_KEYLIGHT_IPS,
} = process.env;

const requireConfigMessage = 'REQUIRED CONFIGURATION WAS NOT PROVIDED';

export const elgatoKeyLightIps: string =
  ELGATO_KEYLIGHT_IPS || fileConfig.elgatoKeyLightIps || requireConfigMessage;

export const tauToken: string =
  TAU_TOKEN || fileConfig.tauToken || requireConfigMessage;

export const tauURL: string =
  TAU_URL || fileConfig.tauURL || requireConfigMessage;

/*****************************************************************************
 * Other
 *****************************************************************************/

export const cameraShadowDurationInMilliseconds: number =
  CAMERA_SHADOW_DURATION_MILLISECONDS ||
  fileConfig.cameraShadowDurationInMilliseconds ||
  30000;

export const cameraShadowFadeDelayInMilliseconds: number =
  CAMERA_SHADOW_FADE_MILLISECONDS ||
  fileConfig.cameraShadowFadeDelayInMilliseconds ||
  250;

export const cameraShadowOpacityModifier: number =
  CAMERA_SHADOW_OPACITY_MODIFIER || fileConfig.cameraShadowOpacityModifier || 2;

/*****************************************************************************
 * App
 *****************************************************************************/

export const port: number = PORT || fileConfig.port || 1337;

export const azureBotEnabled: boolean =
  isTrueString(AZURE_BOT_ENABLED) ||
  isTrueString(fileConfig.azureBotEnabled) ||
  false;

export const isSoundFxEnabled: boolean =
  isTrueString(SOUND_FX_ENABLED) ||
  isTrueString(fileConfig.isSoundFxEnabled) ||
  false;

export const isSceneFxEnabled: boolean =
  isTrueString(SCENE_FX_ENABLED) ||
  isTrueString(fileConfig.isSceneFxEnabled) ||
  false;

/*****************************************************************************
 * Twitch
 *****************************************************************************/

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

export const chatCommandPrefix: string =
  CHAT_COMMAND_PREFIX || fileConfig.chatCommandPrefix || '!';

export const specialEffectsChatCommands = SPECIAL_EFFECTS_CHAT_COMMANDS ||
  fileConfig.specialEffectsChatCommands || [requireConfigMessage];

/*****************************************************************************
 * Azure
 *****************************************************************************/

export const azureBotToken: string =
  AZURE_BOT_TOKEN || fileConfig.azureBotToken || requireConfigMessage;

export const azureBotResponseCheckDelay: number =
  AZURE_BOT_RESPONSE_CHECK_DELAY ||
  fileConfig.azureBotResponseCheckDelay ||
  4000;

export const azureSpeechToken: string =
  AZURE_SPEECH_TOKEN || fileConfig.azureSpeechToken || requireConfigMessage;

export const tokens: any = {
  azureBotToken,
  azureSpeechToken,
};

/*****************************************************************************
 * Discord
 *****************************************************************************/

export const discordHookEnabled: boolean =
  isTrueString(DISCORD_HOOK_ENABLED) ||
  isTrueString(fileConfig.discordHookEnabled) ||
  false;

export const discordHookId: string =
  DISCORD_HOOK_ID || fileConfig.discordHookId || requireConfigMessage;

export const discordHookToken: string =
  DISCORD_HOOK_TOKEN || fileConfig.discordHookToken || requireConfigMessage;

/*****************************************************************************
 * OBS
 *****************************************************************************/

export const obsSocketsKey: string =
  OBS_SOCKETS_KEY || fileConfig.obsSocketsKey || requireConfigMessage;

export const obsSocketsServer: string =
  OBS_SOCKETS_SERVER || fileConfig.obsSocketsServer || 'ws://127.0.0.1:4455';

/*****************************************************************************
 * StreamElements
 *****************************************************************************/

export const streamElementsJwt: string =
  STREAMELEMENTS_JWT || fileConfig.streamElementsJwt || requireConfigMessage;

export const streamElementsWebsocketsUrl: string =
  STREAMELEMENTS_WEBSOCKET_URL ||
  fileConfig.streamElementsWebsocketsUrl ||
  'https://realtime.streamelements.com';

/*****************************************************************************
 * Helpers
 *****************************************************************************/

function isTrueString(value: any) {
  return value === 'true';
}
