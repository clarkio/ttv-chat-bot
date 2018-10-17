import io from 'socket.io-client';
import { log } from './log';

export class AlertsManager {
  connectionType: string = 'websocket';
  public socket!: SocketIOClient.Socket;
  private streamElementsUrl: string = 'https://realtime.streamelements.com';

  constructor(private accessToken: string) {
    this.socket = io(this.streamElementsUrl, {
      transports: [this.connectionType]
    });
  }

  public listenToEvents() {
    // Socket connected
    this.socket.on('connect', this.onConnect);

    // Socket got disconnected
    this.socket.on('disconnect', this.onDisconnect);

    // Socket is authenticated
    this.socket.on('authenticated', this.onAuthenticated);

    // New event received
    this.socket.on('event', this.onEvent);
  }

  private onConnect = () => {
    console.log('Successfully connected to the *Streamelements* websocket');

    this.socket.emit('authenticate', {
      method: 'jwt',
      token: this.accessToken
    });
  };

  private onDisconnect = () => {
    console.log('Disconnected from websocket');
    // Reconnect
  };

  private onAuthenticated(data: any) {
    const { channelId } = data;

    console.log(`Successfully connected to channel ${channelId}`);
  }

  private onEvent(event: any) {
    // Deal with events
    log('info', event);
  }
}

// [
//   {
//     _id: '59e25ed28f25ce00010a0212',
//     channel: '59e10187207b2900014d14d9',
//     type: 'tip',
//     data: {
//       tipId: '59e25ed28f25ce00010a0211',
//       username: 'xd',
//       amount: 21,
//       currency: 'USD',
//       message: 'NaM'
//     },
//     createdAt: '2017-10-14T19:00:34.324Z',
//     provider: 'twitch'
//   }
// ];
