import { app } from './index';
import { log } from './logger';

const tmi = require('tmi.js');
const bot = require('./bot');

import {
  chatCommands,
  specialEffectsChatCommands,
  ttvChannels,
  ttvClientId,
  ttvClientToken,
  ttvClientUsername
} from './config';

export class TwitchChat {
  public ttvChatClient: any;
  private lightCommandUsed: string = '';
  private clientUsername: string = ttvClientUsername.toString();
  private moderators: string[] = [this.clientUsername];
  private lightControlCommands: string[] = chatCommands.toString().split(',');
  private specialEffectCommands = specialEffectsChatCommands
    .toString()
    .split(',');
  private isChatClientEnabled: boolean = true;
  constructor() {
    this.ttvChatClient = new tmi.client(this.setTwitchChatOptions());
    this.connect();
    this.ttvChatClient.on('join', this.ttvJoin);
    this.ttvChatClient.on('part', this.ttvPart);
    this.ttvChatClient.on('chat', this.ttvChat);
  }

  public connect = () => {
    log('info', 'Client is online and running...');
    this.ttvChatClient.connect();
  };

  public pingTtv = () => {
    this.ttvChatClient.ping();
  };
  private setTwitchChatOptions = (): {} => {
    const channels = ttvChannels.toString().split(',');

    return {
      channels,
      connection: {
        reconnect: true
      },
      identity: {
        password: ttvClientToken,
        username: this.clientUsername
      },
      options: {
        clientId: ttvClientId,
        debug: true
      }
    };
  };

  private ttvJoin = (channel: any, username: any, self: any) => {
    // TODO: refactor this to be it's own function since it's not relative to this function
    const date = new Date();
    const rawMinutes = date.getMinutes();
    const rawHours = date.getHours();
    const hours = (rawHours < 10 ? '0' : '') + rawHours.toLocaleString();
    const minutes = (rawMinutes < 10 ? '0' : '') + rawMinutes.toLocaleString();
    const channels = ttvChannels.toString().split(',');

    log('info', `[${hours}:${minutes}] ${username} has JOINED the channel`);

    if (self) {
      log('info', 'This client joined the channel...');
      // Assume first channel in channels array is 'self' - owner monitoring their own channel
      setTimeout(this.pingTtv, 30000);
      this.ttvChatClient
        .mods(channels[0])
        .then((modsFromTwitch: any) => {
          this.moderators = this.moderators.concat(modsFromTwitch);
        })
        .catch((error: any) =>
          log('error', `There was an error getting moderators: ${error}`)
        );
    }
  };

  private ttvPart = (channel: any, username: any) => {
    const date = new Date();
    log(
      'info',
      `[${date.getHours()}:${date.getMinutes()}] ${username} has LEFT the channel`
    );
  };
  private ttvChat = (channel: string, user: any, message: string) => {
    const userName = user['display-name'] || user.username;
    const lowerCaseMessage = message.toLowerCase();

    if (
      this.moderators.indexOf(userName.toLowerCase()) > -1 &&
      this.isLightControlCommand(message)
    ) {
      const logMessage = `Moderator (${userName}) sent a message`;
      log('info', logMessage);

      if (
        lowerCaseMessage.includes('enable') ||
        lowerCaseMessage.includes('disable')
      ) {
        this.isChatClientEnabled = lowerCaseMessage.includes('enable');
        const state = this.isChatClientEnabled ? 'enabled' : 'disabled';
        log(
          'info',
          `TTV Chat Listener to control the lights has been ${state}`
        );
        return;
      }
    }

    if (this.isChatClientEnabled) {
      this.parseChat(lowerCaseMessage, userName);
    } else {
      log(
        'info',
        'Command was ignored because the TTV Chat Listener is disabled'
      );
    }
  };

  private isLightControlCommand = (message: string) =>
    this.lightControlCommands.some(
      (command: string): boolean => {
        const comparison = message.startsWith(command.toLowerCase());
        this.lightCommandUsed = comparison ? command : '';
        return comparison;
      }
    );
  private parseChat(message: string, userName: string) {
    if (this.isLightControlCommand(message)) {
      // viewer attempting to control the overlay/lights
      const commandMessage = message.slice(this.lightCommandUsed.length).trim();
      log('info', `Received a command from ${userName}: ${commandMessage}`);

      if (this.isSpecialEffectCommand(commandMessage)) {
        return this.startSpecialEffects(commandMessage, userName);
      }
      return this.startColorChange(commandMessage, userName);
      // it is an intended, but not a supported command
    }

    if (
      this.isStreamElements(userName) &&
      this.isSpecialEffectCommand(message)
    ) {
      this.startSpecialEffects(message, userName);
    }

    return Promise.resolve('there was nothing to do');
  }

  private isSpecialEffectCommand = (message: any) =>
    this.specialEffectCommands.some((command: any) =>
      message.includes(command)
    );

  private startSpecialEffects(message: any, userName: any) {
    app.overlay.triggerSpecialEffect(message);
    return bot.triggerEffect(message, userName);
  }

  private startColorChange(commandMessage: string, userName: string) {
    app.overlay.updateOverlay(commandMessage);
    return bot
      .sendCommand(commandMessage, userName)
      .then((result: any) => {
        log('info', `Successfully sent the command from ${userName}`);
        return result;
      })
      .catch((error: any) => {
        log('error', error);
        return error;
      });
  }
  private isStreamElements = (userName: string) =>
    userName.toLowerCase() === 'streamelements';
}
