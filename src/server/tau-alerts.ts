import { inject, injectable } from 'inversify';
import * as config from './config';
import WebSocket from 'ws';
import { alertsListener as alertsConstants } from './constants';
import EffectsService from './effects-service';
import { log } from './log';
import TwitchChat from './twitch-chat';
import { TYPES } from './types';

@injectable()
export default class TauAlerts {
  public socket?: WebSocket;
  private accessToken?: string;

  constructor(
    @inject(TYPES.EffectsService) public effectsService: EffectsService,
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
  }

  /**
   * A handler that is used when a connection has successfully completed for the socket.io server and then initiates the authentication flow
   */
  private onConnect = (event: { target: WebSocket }) => {
    log('info', 'Successfully connected to TAU');
    log('info', 'Attempting to authenticate with TAU');

    const message = `{ "token": "${this.accessToken}" }`;
    this.socket!.send(message, this.socketMessageResult);
  };

  private socketMessageResult = (error?: Error) => {
    if (error) {
      log('error', 'There was an issue authenticating with TAU');
    } else {
      log('info', 'Successfully authenticated with TAU and listening for events...');
    }
  }

  //@ts-ignore
  private onDisconnect = (ev: Event) => {
    log('info', alertsConstants.logs.disconnected);
    // TODO: Handle Reconnect
  };

  private onError = (event: { error: any, message: any, type: string, target: WebSocket }) => {
    log('error', 'There was an issue connecting to TAU');
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
  private onEvent = (event: string) => {
    const eventData = JSON.parse(event);
    //@ts-ignore
    console.log('TAU EVENT: ', eventData);
    const alert = this.effectsService.determineAlertEffect(eventData.event_type);
    if (!alert) {
      log('info', alertsConstants.unhandledAlertTypeLog + eventData.event_type);
    }
    if (eventData.event_type.toLocaleLowerCase() === alertsConstants.eventTypes.follow) {
      this.twitchChat.sendChatMessage(`!followthx ${eventData.event_data.user_name}`);
    }
    if (eventData.event_type.toLocaleLowerCase() === alertsConstants.eventTypes.raid) {
      this.twitchChat.sendChatMessage('!new');
    }
  };
}
