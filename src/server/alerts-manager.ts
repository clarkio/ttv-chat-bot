import io from 'socket.io-client';

import { appServer } from './index';
import { log } from './log';
import * as config from './config';
import EffectsManager from './effects-manager';

export class AlertsManager {
  connectionType: string = 'websocket';
  public socket!: SocketIOClient.Socket;
  private constants = {
    websocketsConnectLog:
      'Successfully connected to the *Streamelements* websocket',
    unhandledAlertTypeLog: 'An alert was triggered that is not supported: ',
    authenticateMethod: 'jwt'
  };

  constructor(
    private accessToken: string,
    private effectsManager: EffectsManager
  ) {
    this.socket = io(config.streamElementsWebsocketsUrl, {
      transports: [this.connectionType]
    });
  }

  public listenToEvents() {
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('authenticated', this.onAuthenticated);
    this.socket.on('event', this.onEvent);
  }

  private onConnect = () => {
    log('info', this.constants.websocketsConnectLog);

    this.socket.emit('authenticate', {
      method: this.constants.authenticateMethod,
      token: this.accessToken
    });
  };

  private onDisconnect = () => {
    console.log('Disconnected from websocket');
    // TODO: Handle Reconnect
  };

  private onAuthenticated(data: any) {
    const { channelId } = data;

    console.log(`Successfully connected to channel ${channelId}`);
  }

  private onEvent(event: any) {
    log('info', event.type);
    const alert = this.effectsManager.determineAlertEffect(event.type);
    if (alert) {
      this.startAlertEffect(alert, event.data.username);
    } else {
      log('info', this.constants.unhandledAlertTypeLog + event.type);
    }
  }

  /**
   * Do something cool when there is an alert effect triggered
   *
   * @param alertType alert type sent
   * @param userName user triggered the alert
   */
  private startAlertEffect(alertType: string, userName: string) {
    appServer.overlay.triggerSpecialEffect(alertType);
    if (appServer.azureBot) {
      return appServer.azureBot.triggerEffect(alertType, userName);
    }
  }
}
