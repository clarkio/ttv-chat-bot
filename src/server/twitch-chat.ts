import { appServer } from './index';
import { log } from './log';
import * as config from './config';

import tmi from 'twitch-js';

import {
  chatCommands,
  ttvChannels,
  ttvClientId,
  ttvClientToken,
  ttvClientUsername
} from './config';
import EffectsManager from 'effects-manager';

export class TwitchChat {
  public ttvChatClient: any;
  private lightCommandUsed: string = '';
  private clientUsername: string = ttvClientUsername.toString();
  private moderators: string[] = [this.clientUsername];
  private lightControlCommands: string[] = chatCommands.toString().split(',');
  private isChatClientEnabled: boolean = true;

  constructor(private effectsManager: EffectsManager) {
    this.ttvChatClient = new tmi.client(this.setTwitchChatOptions());
    this.ttvChatClient.on('join', this.ttvJoin);
    this.ttvChatClient.on('part', this.ttvPart);
    this.ttvChatClient.on('chat', this.ttvChat);
  }

  /**
   * Connect to the TTV Chat Client
   */
  public connect = () => {
    log('info', 'Client is online and running...');
    this.ttvChatClient.connect();
  };

  /**
   * Ping twitch
   */
  public pingTtv = () => {
    this.ttvChatClient.ping();
  };

  /**
   * Set the options for the twitch bot
   */
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

  /**
   * When a user joins the channel
   */
  private ttvJoin = (channel: string, username: string, self: boolean) => {
    const { hours, minutes } = this.getTime();
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

  /**
   * When a user leaves the channel
   */
  private ttvPart = (channel: string, username: string) => {
    const { hours, minutes } = this.getTime();
    log('info', `[${hours}:${minutes}] ${username} has LEFT the channel`);
  };

  /**
   * When a user sends a message in chat
   */
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

  /**
   * Check if the message is a light control command
   */
  private isLightControlCommand = (message: string) =>
    this.lightControlCommands.some(
      (command: string): boolean => {
        const comparison = message.startsWith(command.toLowerCase());
        this.lightCommandUsed = comparison ? command : '';
        return comparison;
      }
    );

  private getTime = () => {
    const date = new Date();
    const rawMinutes = date.getMinutes();
    const rawHours = date.getHours();
    const hours = (rawHours < 10 ? '0' : '') + rawHours.toLocaleString();
    const minutes = (rawMinutes < 10 ? '0' : '') + rawMinutes.toLocaleString();
    return { hours, minutes };
  };

  /**
   * This weeds through the trolls and deciphers if the message is something that we want to do
   * something about
   *
   * @param message the message sent by a user
   * @param userName the user who sent the message
   */
  private parseChat = (message: string, userName: string) => {
    if (this.isLightControlCommand(message)) {
      // viewer attempting to control the overlay/lights
      const commandMessage = message.slice(this.lightCommandUsed.length).trim();
      log('info', `Received a command from ${userName}: ${commandMessage}`);
      const specialEffect = this.isSpecialEffectCommand(commandMessage);

      if (specialEffect) {
        return this.startSpecialEffects(specialEffect, userName);
      }

      return this.startColorChange(commandMessage, userName);
    }

    if (
      this.isStreamElements(userName) &&
      this.isSpecialEffectCommand(message)
    ) {
      return this.startSpecialEffects(message, userName);
    }

    return Promise.resolve('there was nothing to do');
  };

  /**
   * Check if the message is for special effects!
   */
  private isSpecialEffectCommand = (message: string) =>
    this.effectsManager.determineSpecialEffect(message);

  /**
   * Do something cool when there is a special effect triggered
   *
   * @param specialEffect message sent
   * @param userName user who sent
   */
  private startSpecialEffects = (specialEffect: any, userName: string) => {
    appServer.overlay.triggerSpecialEffect(specialEffect.colors);
    if (appServer.azureBot) {
      return appServer.azureBot
        .triggerEffect(specialEffect, userName)
        .then(result => {
          setTimeout(
            this.checkForBotResponse,
            config.azureBotResponseCheckDelay
          );
          return result;
        });
    }
  };

  /**
   * Change the color in multiple places if needed
   *
   * @param commandMessage message to send to the bot
   * @param userName who sent the message
   */
  private startColorChange = (commandMessage: string, userName: string) => {
    appServer.overlay.updateOverlay(commandMessage);

    if (appServer.azureBot) {
      return appServer.azureBot
        .sendCommand(commandMessage, userName)
        .then((result: any) => {
          log('info', `Successfully sent the command from ${userName}`);
          setTimeout(
            this.checkForBotResponse,
            config.azureBotResponseCheckDelay
          );
          return result;
        })
        .catch((error: any) => {
          log('error', error);
          return error;
        });
    }
  };

  private checkForBotResponse = () => {
    appServer.azureBot
      .getConversationMessages()
      .then(result => {
        const messages = result.messages;
        const lastMessage = messages[messages.length - 1].text;
        log('info', `Bot response: ${lastMessage}`);
        this.ttvChatClient.say('clarkio', lastMessage);
      })
      .catch(error => log('error', error));
  };
  /**
   * USER OUR BOT TO SEE OTHER BOTS
   */
  private isStreamElements = (userName: string) =>
    userName.toLowerCase() === 'streamelements';
}
