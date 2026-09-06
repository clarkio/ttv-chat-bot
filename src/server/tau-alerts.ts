import { inject, injectable } from 'inversify';
import * as config from './config';
import WebSocket, { CloseEvent, ErrorEvent } from 'ws';
import { alertsListener as alertsConstants } from './constants';
import { log } from './log';
import TwitchChat from './twitch-chat';
import { TYPES } from './types';
import TauApi from './tau-api';
import EffectsService from './effects-service';

enum TauEventTypes {
  ChannelPointRedemptionAdd = 'channel-channel_points_custom_reward_redemption-add',
  ChannelPointRedemptionUpdate = 'channel-channel_points_custom_reward_redemption-update',
  Follow = 'channel-follow',
  Subscribe = 'channel-subscribe',
  Raid = 'channel-raid',
  Default = '',
}

@injectable()
export default class TauAlerts {
  public socket!: WebSocket;
  private accessToken?: string;

  constructor(
    @inject(TYPES.EffectsService) public effectsService: EffectsService,
    @inject(TYPES.TwitchChat) public twitchChat: TwitchChat,
    @inject(TYPES.TauApi) public tauApi: TauApi
  ) {
    this.accessToken = config.tauToken;
  }

  /**
   * Start connection and set up handlers for listening to socket.io events that occur
   */
  public startListening() {
    log('info', 'Attempting to connect to TAU...');
    this.socket = new WebSocket(`wss://${config.tauURL}/ws/twitch-events/`, {
      protocol: 'wss',
      passphrase: config.tauToken,
    });

    this.socket.on('open', this.onOpen);
    this.socket.on('error', this.onError);
    this.socket.on('message', this.onMessage);
    this.socket.on('close', this.onClose);
    this.socket.on('redirect', this.onGenericEvent);
    this.socket.on('unexpected-response', this.onGenericEvent);
  }

  private onGenericEvent(event: any) {
    log('info', 'Something happened');
    console.dir(event);
  }

  private onClose(event: CloseEvent) {
    log('info', `Closing connection to TAU`);
    log('info', `Close event: ${event}`);
    log('info', `Closed for reason: ${event.reason}`);
  }

  /**
   * A handler that is used when a connection has successfully completed for the socket  server and then initiates the authentication flow
   */
  private onOpen = (socket: WebSocket) => {
    log('info', 'Successfully connected to TAU');
    log('info', 'Attempting to authenticate with TAU');

    const message = `{ "token": "${this.accessToken}" }`;
    this.socket.send(message, this.socketMessageResult);
  };

  private socketMessageResult = (error?: Error) => {
    if (error) {
      log('error', 'There was an issue authenticating with TAU');
      log('error', `TAU Authentication Error: ${error}`);
    } else {
      log(
        'info',
        'Successfully authenticated with TAU and listening for events...'
      );
    }
  };

  private onError = (event: ErrorEvent) => {
    log(
      'error',
      'There was an error found within the TAU websocket connection'
    );
    log('error', event.type);
    log('error', event.message);
    log('error', event.error);
  };

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
  private onMessage = (event: string) => {
    const eventData = JSON.parse(event);
    if (eventData.event && eventData.event === 'keep_alive') return;

    const eventType = eventData.event_type;
    // Convert event to enum for easier calculations
    const tauEvent =
      Object.values(TauEventTypes).find((id) => id === eventType) ??
      TauEventTypes.Default;

    switch (tauEvent) {
      case TauEventTypes.ChannelPointRedemptionAdd:
        this.effectsService.handleChannelPointRedemption(eventData);
        return;
      default:
        log(
          'info',
          `A TAU event was received that this bot hasn't been configured to support yet: ${eventType}`
        );
    }
  };
}
