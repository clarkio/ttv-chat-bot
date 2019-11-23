import io from 'socket.io-client';

import { log } from './log';
import * as config from './config';
import EffectsManager from './effects-manager';
import { TwitchChat } from './twitch-chat';
import { alertsManager as alertsConstants } from './constants';

export class AlertsManager {
  public socket!: SocketIOClient.Socket;

  constructor(
    private accessToken: string,
    private effectsManager: EffectsManager,
    private twitchChat: TwitchChat
  ) {
    this.socket = io(config.streamElementsWebsocketsUrl, {
      transports: [alertsConstants.connectionType]
    });
  }

  /**
   * Set up handlers for listening to socket.io events that occur
   */
  public listenToEvents() {
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('authenticated', this.onAuthenticated);
    this.socket.on('event', this.onEvent);
  }

  /**
   * A handler that is used when a connection has successfully completed for the socket.io server and then initiates the authentication flow
   */
  private onConnect = () => {
    log('info', alertsConstants.websocketsConnectLog);

    this.socket.emit('authenticate', {
      method: alertsConstants.authenticateMethod,
      token: this.accessToken
    });
  };

  private onDisconnect = () => {
    log('info', alertsConstants.logs.disconnected);
    // TODO: Handle Reconnect
  };

  /**
   * A handler function to receive the result of successfully authenticating with the socket.io server and storing the channelId for that server
   */
  private onAuthenticated = (data: any) => {
    log('info', alertsConstants.logs.authenticated);
  };

  /**
   * A handler function to receive events that occur on the socket.io channel and take action upon those events. In this case we'll be trying to determine if there was an alert
   */
  private onEvent = (event: any) => {
    const alert = this.effectsManager.determineAlertEffect(event.type);
    if (alert) {
      this.startAlertEffect(alert, event.data.username);
      if (event.type.toLocaleLowerCase() === alertsConstants.eventTypes.raid) {
        this.effectsManager.checkForCommand('sandstorm');
      }
    } else {
      log('info', alertsConstants.unhandledAlertTypeLog + event.type);
    }
    if (event.type.toLocaleLowerCase() === alertsConstants.eventTypes.follow) {
      this.twitchChat.sendChatMessage(`!followthx ${event.data.username}`);
    }
    if (event.type.toLocaleLowerCase() === alertsConstants.eventTypes.raid) {
      this.twitchChat.sendChatMessage('!new');
    }
  };

  /**
   * After determining that an alert happened trigger any corresponding effects for that alert
   *
   * @param alertEffect alert type sent
   * @param userName user triggered the alert
   */
  private startAlertEffect = (alertEffect: any, userName: string) => {
    this.effectsManager.triggerSpecialEffect(alertEffect.colors);
    this.effectsManager.triggerAzureBotEffect(alertEffect, userName);
  };
}
