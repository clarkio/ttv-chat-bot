// tslint:disable-next-line: no-var-requires
const ObsWebSocket = require('obs-websocket-js');

export default class ObsManager {
  obs: any;
  constructor() {
    this.obs = new ObsWebSocket();
    this.obs.connect({
      address: 'localhost:4444',
      password: '$up3rSecretP@ssw0rd'
    });
  }
}
