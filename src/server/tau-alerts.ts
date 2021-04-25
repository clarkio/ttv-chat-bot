import { inject, injectable } from 'inversify';
import * as config from './config';
import WebSocket from 'ws';
import { alertsListener as alertsConstants } from './constants';
import EffectsManager from './effects-manager';
import { log } from './log';
import TwitchChat from './twitch-chat';
import { TYPES } from './types';

@injectable()
export default class TauAlerts {
  public socket?: WebSocket;
  private accessToken?: string;

  constructor(
    @inject(TYPES.EffectsManager) public effectsManager: EffectsManager,
    @inject(TYPES.TwitchChat) public twitchChat: TwitchChat
  ) {
    this.accessToken = config.tauToken;
  }

  /**
   * Start connection and set up handlers for listening to socket.io events that occur
   */
  public startListening() {
    log('info', 'Attempting to connect to TAU...')
    this.socket = new WebSocket(config.tauURL, { protocol: 'wss', passphrase: config.tauToken });

    this.socket.on('open', this.onConnect);
    this.socket.on('error', this.onError);
    this.socket.on('message', this.onEvent);
    // this.socket.addEventListener('open', this.onConnect);
    // this.socket.addEventListener('message', this.onEvent);
    // this.socket.addEventListener('error', this.onError);

    // this.socket.on('open', this.onConnect);
    // this.socket.on('message', this.onEvent);
    // this.socket.on('disconnect', this.onDisconnect);
    // this.socket.on('authenticated', this.onAuthenticated);
  }

  /**
   * A handler that is used when a connection has successfully completed for the socket.io server and then initiates the authentication flow
   */
  private onConnect = (event: { target: WebSocket }) => {
    log('info', 'Successfully connected to TAU');

    this.socket!.send(`{ "token": "${this.accessToken}"`);
  };
  //@ts-ignore
  private onDisconnect = (ev: Event) => {
    log('info', alertsConstants.logs.disconnected);
    // TODO: Handle Reconnect
  };

  private onError = (event: { error: any, message: any, type: string, target: WebSocket }) => {
    log('error', event.message);
  }

  /**
   * A handler function to receive the result of successfully authenticating with the socket.io server and storing the channelId for that server
   */
  //@ts-ignore
  private onAuthenticated = (data: any) => {
    log('info', alertsConstants.logs.authenticated);
  };

  /**
   * A handler function to receive events that occur on the socket.io channel and take action upon those events. In this case we'll be trying to determine if there was an alert
   */
  private onEvent = (event: { data: any; type: string; target: WebSocket }) => {
    //@ts-ignore
    console.log('TAU EVENT: ', event);

    // const alert = this.effectsManager.determineAlertEffect(event.type);
    // if (alert) {
    //   this.startAlertEffect(alert, event.data.username);
    // } else {
    //   log('info', alertsConstants.unhandledAlertTypeLog + event.type);
    // }
    // if (event.type.toLocaleLowerCase() === alertsConstants.eventTypes.follow) {
    //   this.twitchChat.sendChatMessage(`!followthx ${event.data.username}`);
    // }
    // if (event.type.toLocaleLowerCase() === alertsConstants.eventTypes.raid) {
    //   this.twitchChat.sendChatMessage('!new');
    // }
  };

  /**
   * After determining that an alert happened trigger any corresponding effects for that alert
   *
   * @param alertEffect alert type sent
   * @param userName user triggered the alert
   */
  //@ts-ignore
  private startAlertEffect = (alertEffect: any, userName: string) => {
    // this.effectsManager.triggerSpecialEffect(alertEffect.colors);
    this.effectsManager.triggerAzureBotEffect(alertEffect, userName);
  };
}
