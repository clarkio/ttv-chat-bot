"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { readFileSync } = require('fs');
const { resolve } = require('path');
require('dotenv').config();
const captains = console;
let fileConfig;
try {
    const buffer = readFileSync(resolve(__dirname, '../config.json'));
    fileConfig = JSON.parse(buffer.toString());
}
catch (e) {
    captains.log('There was an error retrieving configuration from a file', e);
    fileConfig = {};
}
const { PORT, BOT_ENABLED, TTV_CLIENT_ID, TTV_CLIENT_TOKEN, TTV_CLIENT_USERNAME, TTV_CHANNELS, CHAT_COMMANDS, SPECIAL_EFFECTS_CHAT_COMMANDS, AZURE_BOT_TOKEN, DISCORD_HOOK_ENABLED, DISCORD_HOOK_ID, DISCORD_HOOK_TOKEN } = process.env;
exports.port = PORT || fileConfig.port || 1337;
exports.botEnabled = BOT_ENABLED || fileConfig.botEnabled || 'false';
exports.ttvClientId = TTV_CLIENT_ID ||
    fileConfig.ttvClientId ||
    'REQUIRED CONFIGURATION WAS NOT PROVIDED';
exports.ttvClientToken = TTV_CLIENT_TOKEN ||
    fileConfig.ttvClientToken ||
    'REQUIRED CONFIGURATION WAS NOT PROVIDED';
exports.ttvClientUsername = TTV_CLIENT_USERNAME || fileConfig.ttvClientUsername || 'clarkio';
exports.ttvChannels = TTV_CHANNELS ||
    fileConfig.ttvChannels || ['clarkio'];
exports.chatCommands = CHAT_COMMANDS ||
    fileConfig.chatCommands || ['REQUIRED CONFIGURATION WAS NOT PROVIDED'];
exports.specialEffectsChatCommands = SPECIAL_EFFECTS_CHAT_COMMANDS ||
    fileConfig.specialEffectsChatCommands || [
    'REQUIRED CONFIGURATION WAS NOT PROVIDED'
];
exports.azureBotToken = AZURE_BOT_TOKEN ||
    fileConfig.azureBotToken ||
    'REQUIRED CONFIGURATION WAS NOT PROVIDED';
exports.discordHookEnabled = DISCORD_HOOK_ENABLED || fileConfig.discordHookEnabled || 'false';
exports.discordHookId = DISCORD_HOOK_ID ||
    fileConfig.discordHookId ||
    'REQUIRED CONFIGURATION WAS NOT PROVIDED';
exports.discordHookToken = DISCORD_HOOK_TOKEN ||
    fileConfig.discordHookToken ||
    'REQUIRED CONFIGURATION WAS NOT PROVIDED';
module.exports = {
    port: exports.port,
    botEnabled: exports.botEnabled,
    ttvClientId: exports.ttvClientId,
    ttvClientToken: exports.ttvClientToken,
    ttvClientUsername: exports.ttvClientUsername,
    ttvChannels: exports.ttvChannels,
    chatCommands: exports.chatCommands,
    specialEffectsChatCommands: exports.specialEffectsChatCommands,
    azureBotToken: exports.azureBotToken,
    discordHookEnabled: exports.discordHookEnabled,
    discordHookId: exports.discordHookId,
    discordHookToken: exports.discordHookToken
};
//# sourceMappingURL=config.js.map