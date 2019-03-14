import * as config from './config';

import ObsWebSocket from 'obs-websocket-js';

export default class ObsManager {
  public sceneList: any;
  private obs: ObsWebSocket;

  constructor() {
    this.obs = new ObsWebSocket();
    this.obs
      .connect({
        address: config.obsSocketsServer,
        password: config.obsSocketsKey
      })
      .then(() => {
        this.getSceneList();
      });
    this.obs.on('error', this.handleError);
  }

  public async getCurrentScene(): Promise<string> {
    return this.obs.send('GetCurrentScene');
  }

  public async updateScene(
    sceneName: string,
    sourceName: string
  ): Promise<any> {
    return this.obs.send('SetSceneItemProperties', {
      item: sourceName,
      'scene-name': sceneName
    });
  }

  public determineSceneEffectFromSound(soundEffect: string): any {
    throw new Error('Method not implemented.');
  }

  private handleError(error: any): any {
    console.error(error);
  }

  private getSceneList() {
    this.obs.send('GetSceneList').then((data: any) => {
      console.log('Scenes Found:', data.scenes);
      this.sceneList = data.scenes;
    });
  }
}
