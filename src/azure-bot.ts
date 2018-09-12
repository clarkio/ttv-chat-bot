import { azureBotToken, botEnabled } from './config';
import { log } from './log';

import fetch from 'node-fetch';

/**
 * A Plugin of sorts to deal with the AzureBot if the user has decided to configure it
 */
export class AzureBot {
  private azureBotToken = azureBotToken;
  private azureBotEnabled = botEnabled;
  private azureBot = {};

  private conversationId: any;
  private conversationToken: any;
  private expiration: number | undefined;

  constructor() {
    //
  }

  /**
   * This will trigger specific effects based on the message
   *
   * @param message - The message sent in chat
   * @param userName - The user who sent the message
   */
  public triggerEffect = (message: string, userName: string) => {
    let effect: string;
    if (!message.includes('follow')) {
      effect = 'trigger new subscriber';
    } else {
      effect = 'trigger new follower';
    }

    if (effect) {
      return this.sendCommand(effect, userName)
        .then((result: any) => {
          log(
            'info',
            `Successfully triggered ${effect} command from ${userName}`
          );
          return result;
        })
        .catch((error: string) => {
          log('error', error);
          return error;
        });
    }
    log('info', `Unsupported effect was received in the message: ${message}`);
    return Promise.resolve('TODO = put something useful here');
  };

  /**
   * This will send the command to the azure bot if the user has configured it.
   *
   * @param commandMessage - The message to be sent
   * @param user - The user who sent the message
   */
  public sendCommand = (commandMessage: string, user: string) => {
    const fullMessage = { text: commandMessage, from: user };
    const url = `https://directline.botframework.com/api/conversations/${
      this.conversationId
    }/messages`;
    return fetch(url, {
      body: JSON.stringify(fullMessage),
      headers: {
        Authorization: `Bearer ${this.conversationToken}`,
        'content-type': 'application/json'
      },
      method: 'POST',
      mode: 'cors'
    })
      .then((response: any) => response)
      .catch((error: string) => {
        log('error', error);
        return error;
      });
  };

  /**
   * Opens up communication with the Azure bot if configured
   */
  public createNewBotConversation = () => {
    log('info', `Starting a new bot conversation at: ${new Date()}`);
    this.startBotConversation()
      .then((result: any) => {
        if (result.error) {
          log('error', result.error);
          return result.error;
        }
        log('info', 'Bot conversation started');
        // eslint-disable-next-line prefer-destructuring
        this.conversationId = result.conversationId;
        this.conversationToken = result.token;
        const expiresIn = parseInt(result.expires_in, 10);
        this.expiration = new Date().getSeconds() + expiresIn - 30;
        return this.createTimeout(this.expiration);
      })
      .catch((error: any) => {
        log('error', error);
        return error;
      });
  };

  /**
   * Contacts the bot url to authenticate the communication
   */
  private startBotConversation = () => {
    // const url = 'https://directline.botframework.com/api/conversations';
    const url =
      'https://directline.botframework.com/v3/directline/conversations';
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${this.azureBotToken}`
      },
      method: 'POST'
    })
      .then((response: any) => response.json())
      .catch((error: string) => {
        log(
          'info',
          `There was an error starting a conversation with the bot: ${error}`
        );
        return error;
      });
  };

  /**
   * This takes the time you pass in, converts to milliseconds then creates a timeout
   *
   * @param expirationTime - The time you want to timeout for
   */
  private createTimeout = (expirationTime: number) => {
    const timeInMilliseconds = expirationTime * 1000;
    setTimeout(this.createNewBotConversation, timeInMilliseconds);
  };

  /**
   * Better than naming the function DoNothing
   */
  private noop = (): void => {
    //
  };

  /**
   * A Promise to do nothing
   */
  private noopPromise = () => ({
    catch: () => Promise.reject(),
    then: () => Promise.resolve()
  });
}
