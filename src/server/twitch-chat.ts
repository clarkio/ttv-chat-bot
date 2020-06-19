import { ChatUserstate, Client } from 'tmi.js';
import * as config from './config';
import {
  ttvChannels,
  ttvClientId,
  ttvClientToken,
  ttvClientUsername,
} from './config';
import { twitchChat as constants } from './constants';
import EffectsManager from './effects-manager';
import { log } from './log';
import TwitchUser from './twitch-user';

export class TwitchChat {
  public ttvChatClient: Client;
  private lightCommandUsed: string = '';
  private clientUsername: string = ttvClientUsername.toString();
  private moderators: string[] = [this.clientUsername];
  private lightControlCommands: string[] = [
    constants.defaultLightControlCommand,
  ];
  private isChatClientEnabled: boolean = true;

  constructor(private effectsManager: EffectsManager) {
    this.ttvChatClient = Client(this.setTwitchChatOptions());
    this.ttvChatClient.on('join', this.ttvJoin);
    this.ttvChatClient.on('part', this.ttvPart);
    this.ttvChatClient.on('chat', this.ttvChat);
  }

  /**
   * Connect to the TTV Chat Client
   */
  public connect = () => {
    log('info', constants.logs.twitchConnectionAttemptMessage);
    this.ttvChatClient
      .connect()
      .then(() => {
        log('info', constants.logs.twitchConnectionSuccessMessage);
      })
      .catch((error) => {
        log('error', constants.logs.twitchConnectionFailMessage);
        log('error', error);
      });
  };

  /**
   * Ping twitch
   */
  public pingTtv = () => {
    this.ttvChatClient.ping();
  };

  public sendChatMessage(message: string) {
    // Default to first channel in connected channels
    this.ttvChatClient.say(
      config.ttvChannels.toString().split(',')[0],
      message
    );
  }

  /**
   * Set the options for the twitch bot
   */
  private setTwitchChatOptions = (): {} => {
    const channels = ttvChannels.toString().split(',');

    return {
      channels,
      connection: {
        reconnect: true,
        secure: false,
      },
      identity: {
        password: ttvClientToken,
        username: this.clientUsername,
      },
      options: {
        clientId: ttvClientId,
        debug: true,
      },
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
      log('info', constants.logs.twitchClientJoinedMessage);
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
    } else {
      this.effectsManager.activateJoinEffectIfFound(
        username.toLocaleLowerCase()
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
  private ttvChat = (
    channel: string,
    userState: ChatUserstate,
    message: string
  ) => {
    const user = new TwitchUser(userState, channel, ttvClientUsername);
    const lowerCaseMessage = message.toLowerCase();
    // @ts-ignore
    const isHighlightedMessage = userState['msg-id'] === 'highlighted-message';
    // @ts-ignore
    const customRewardId = userState['custom-reward-id'] || null;

    if (user.isMod && this.isLightControlCommand(message)) {
      const logMessage = `Moderator (${user.username}) sent a message`;
      log('info', logMessage);

      if (
        lowerCaseMessage.includes(constants.enableCommandMessage) ||
        lowerCaseMessage.includes(constants.disableCommandMessage)
      ) {
        this.isChatClientEnabled = lowerCaseMessage.includes(
          constants.enableCommandMessage
        );
        const state = this.isChatClientEnabled ? 'enabled' : 'disabled';
        log(
          'info',
          `TTV Chat Listener to control the lights has been ${state}`
        );
        return;
      }
    }

    if (this.isChatClientEnabled) {
      this.parseChat(lowerCaseMessage, user, customRewardId);
    } else {
      log('info', constants.logs.ignoredCommandMessage);
      this.sendChatMessage('Bot is not enabled');
    }
  };

  /**
   * Check if the message is a light control command
   */
  private isLightControlCommand = (message: string) =>
    this.lightControlCommands.some((command: string): boolean => {
      const comparison = message.startsWith(command.toLowerCase());
      this.lightCommandUsed = comparison ? command : '';
      return comparison;
    });

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
  private parseChat = (
    message: string,
    user: TwitchUser,
    customRewardId: string
  ) => {
    const userName = user.username;
    if (
      customRewardId &&
      customRewardId === '5fccfdfc-0248-4786-8ab7-68bed4fcb2cb'
    ) {
      const ttsMessage = this.isTrustedUser(user)
        ? `${userName} says ${message}`
        : message;
      this.effectsManager.appServer.io.emit('tts', ttsMessage);
    }

    if ((user.isBroadcaster || user.isMod) && message.startsWith('!skip')) {
      this.effectsManager.appServer.io.emit('tts-skip');
    }

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

    if (this.isOtherCommand(message)) {
      this.effectsManager.checkForCommand(message);
    }

    return Promise.resolve(constants.logs.nothingToParseMessage);
  };

  private isTrustedUser(user: TwitchUser): boolean {
    return user.isBroadcaster || user.isMod || user.isSubscriber || user.isVIP;
  }

  /**
   * Checks if the chat message received is intended for other commands by validating the command prefix character is present (such as '!')
   * @param message chat message to check
   */
  private isOtherCommand(message: string): any {
    return (
      message.startsWith(config.chatCommandPrefix) ||
      message.includes(constants.heccEmote)
    );
  }

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
    this.effectsManager.triggerSpecialEffect(specialEffect.colors);
    if (this.effectsManager.azureBot) {
      return this.effectsManager.azureBot
        .triggerEffect(specialEffect, userName)
        .then((result) => {
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
    // TODO Convert color names to hex code before sending to the bot?
    this.effectsManager.updateOverlay(commandMessage);

    // TODO update so that effects manager handles azure bot related workload
    if (this.effectsManager.azureBot) {
      return this.effectsManager.azureBot
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
    // TODO update so that effects manager handles azure bot related workload
    this.effectsManager.azureBot
      .getConversationMessages()
      .then((result: any) => {
        const messages = result.messages;
        const lastMessage = messages[messages.length - 1].text;
        log('info', `Bot response: ${lastMessage}`);
        this.ttvChatClient.say('clarkio', lastMessage);
      })
      .catch((error) => log('error', error));
  };
  /**
   * USER OUR BOT TO SEE OTHER BOTS
   */
  private isStreamElements = (userName: string) =>
    userName.toLowerCase() === constants.streamElementsUserName;
}
