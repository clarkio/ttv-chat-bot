import { azureBotToken, botEnabled } from './config';
import { log } from './log';

const fetch = require('node-fetch');

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

  public triggerEffect = (message: string, userName: string) => {
    if (!this.azureBotEnabled) {
      log('info', 'Azure bot not configured, triggerEffect not sent');
      return this.noop;
    }
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

  public sendCommand = (commandMessage: string, user: string) => {
    if (!this.azureBotEnabled) {
      log('info', 'Azure bot not configured, sendCommand not sent');
      return this.noopPromise;
    }
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

  public createNewBotConversation = () => {
    if (!this.azureBotEnabled) {
      log('info', 'Azure Bot is not configured');
      return;
    }
    log('info', `Starting a new bot conversation at: ${new Date()}`);
    this.startBotConversation().then((result: any) => {
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
    });
  };

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

  private createTimeout = (expirationTime: number) => {
    const timeInMilliseconds = expirationTime * 1000;
    setTimeout(this.createNewBotConversation, timeInMilliseconds);
  };

  private noop = (): void => {
    //
  };
  private noopPromise = () => ({
    catch: () => Promise.reject(),
    then: () => Promise.resolve()
  });
}
