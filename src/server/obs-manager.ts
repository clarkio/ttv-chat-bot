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
      })
      .catch(this.handleError);
    this.obs.on('error', this.handleError);
  }

  public async getCurrentScene(): Promise<string> {
    return this.obs.send('GetCurrentScene');
  }

  public async updateScene(sceneEffect: {
    sceneName: string;
    sourceName: string;
    visible: boolean;
  }): Promise<any> {
    return this.obs.send('SetSceneItemProperties', {
      item: sceneEffect.sourceName,
      'scene-name': sceneEffect.sceneName,
      visible: sceneEffect.visible
    });
  }

  public determineSceneEffectFromSound(soundEffect: string): any {
    return {
      sceneName: 'Stream End',
      sourceName: 'pbj-banana',
      visible: true
    };
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
