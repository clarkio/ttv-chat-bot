import { inject, injectable } from 'inversify';
import { io, Socket } from 'socket.io-client';
import * as config from './config';
import { alertsListener as alertsConstants } from './constants';
import EffectsService from './effects-service';
import { log } from './log';
import TwitchChat from './twitch-chat';
import { TYPES } from './types';

@injectable()
export default class StreamElementsAlerts {
  public socket!: Socket;
  private accessToken?: string;

  constructor(
    @inject(TYPES.EffectsService) public effectsService: EffectsService,
    @inject(TYPES.TwitchChat) public twitchChat: TwitchChat
  ) {
    this.accessToken = config.streamElementsJwt;
  }

  /**
   * Start connection and set up handlers for listening to socket.io events that occur
   */
  public startListening() {
    this.socket = io(config.streamElementsWebsocketsUrl, {
      transports: [alertsConstants.connectionType],
    });

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
      token: this.accessToken,
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
    const alert = this.effectsService.determineAlertEffect(event.type);
    if (!alert) {
      log('info', alertsConstants.unhandledAlertTypeLog + event.type);
    }
    if (event.type.toLocaleLowerCase() === alertsConstants.eventTypes.follow) {
      this.twitchChat.sendChatMessage(`!followthx ${event.data.username}`);
    }
    if (event.type.toLocaleLowerCase() === alertsConstants.eventTypes.raid) {
      this.twitchChat.sendChatMessage('!new');
    }
  };
}
