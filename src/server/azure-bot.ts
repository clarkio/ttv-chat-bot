import fetch from 'isomorphic-fetch';

import * as config from './config';
import { log } from './log';

/**
 * A Plugin of sorts to deal with the AzureBot if the user has decided to configure it
 */
export class AzureBot {
  private azureBotToken = config.azureBotToken;

  private conversationId: string | undefined;
  private conversationToken: string | undefined;
  private expiration: number | undefined;
  private watermark: string | undefined;

  constructor() {
    //
  }

  /**
   * This will trigger specific effects based on the message
   *
   * @param effect - The effect object containing the type and colors of the effect
   * @param userName - The user who sent the message
   */
  public triggerEffect = (effect: any, userName: string) => {
    const effectCommand = `${effect.type} ${[...effect.colors]} ${effect.state}`
      .replace(',', ' ')
      .trim();

    return this.sendCommand(effectCommand, userName)
      .then((result: any) => {
        log(
          'info',
          `Successfully triggered '${effectCommand}' command from ${userName}`
        );
        return result;
      })
      .catch((error: any) => {
        log('error', error.message);
        return error;
      });
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
    const fetchOptions: RequestInit = {
      body: JSON.stringify(fullMessage),
      headers: {
        Authorization: `Bearer ${this.conversationToken}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      mode: 'cors'
    };

    return fetch(url, fetchOptions)
      .then((response: any) => response)
      .catch((error: any) => {
        log('error', error.message);
        return error;
      });
  };

  /**
   * Opens up communication with the Azure bot if configured
   */
  public createNewBotConversation = () => {
    // For some reason we can't use the log when discord hook is enabled
    // seems to be a timing issue where discord hook is undefined
    // log('info', `Starting a new bot conversation at: ${new Date()}`);
    this.startBotConversation()
      .then((result: any) => this.handleConversationStart(result))
      .catch((error: any) => {
        log('error', error);
        return error;
      });
  };

  public getConversationMessages = () => {
    // The watermark let's us only retrieve new messages
    // since the last time we checked on the conversation
    const watermarkQuery = this.watermark ? `?watermark=${this.watermark}` : '';
    const url = `https://directline.botframework.com/api/conversations/${
      this.conversationId
    }/messages${watermarkQuery}`;
    const fetchOptions: RequestInit = {
      headers: {
        Authorization: `Bearer ${this.conversationToken}`,
        'Content-Type': 'application/json'
      },
      method: 'GET'
    };

    return fetch(url, fetchOptions)
      .then((response: any) => {
        // Since we need to get the watermark before returning
        // the conversation messages we'll return a new Promise
        return new Promise((resolve, reject) => {
          response
            .json()
            .then((conversation: any) => {
              if (conversation.watermark) {
                this.watermark = conversation.watermark;
              }
              resolve(conversation);
            })
            .catch(this.handleError);
        });
      })
      .catch(this.handleError);
  };

  private handleConversationStart = (result: any) => {
    if (result.Error) {
      log('Error', result.Error);
      return result.Error;
    }
    log('info', 'Bot conversation started');

    // eslint-disable-next-line prefer-destructuring
    this.conversationId = result.conversationId;
    this.conversationToken = result.token;

    const expiresIn = parseInt(result.expires_in, 10);
    // Renew conversation 30 seconds before token expiration
    this.expiration = expiresIn - 30;

    return this.createTimeoutToRenewConversation(this.expiration);
  };

  /**
   * Contacts the bot url to authenticate the communication
   */
  private startBotConversation = () => {
    const url = config.azureBotUrl;
    const fetchOptions: RequestInit = {
      headers: {
        Authorization: `Bearer ${this.azureBotToken}`
      },
      method: 'POST'
    };

    return fetch(url, fetchOptions)
      .then((response: any) => {
        return response.json();
      })
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
  private createTimeoutToRenewConversation = (expirationTime: number) => {
    const timeInMilliseconds = expirationTime * 1000;
    setTimeout(this.createNewBotConversation, timeInMilliseconds);
  };

  private handleError = (error: any) => {
    log('error', error.message);
    return error;
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
