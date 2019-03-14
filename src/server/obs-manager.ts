import * as config from './config';

import ObsWebSocket from 'obs-websocket-js';

enum EffectType {
  SourceChange = 'SourceChange'
}

export class SceneEffect {
  constructor() {
    //
  }
}

export default class ObsManager {
  public sceneList: any;
  private obs: ObsWebSocket;
  private activeSceneEffects: any[] = new Array<any>();

  constructor(private sceneEffects: any | undefined) {
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
    this.activeSceneEffects.push(sceneEffect);
    return this.obs.send('SetSceneItemProperties', {
      item: sceneEffect.sourceName,
      'scene-name': sceneEffect.sceneName,
      visible: sceneEffect.visible
    });
  }

  public async stopSceneEffects() {
    this.activeSceneEffects.forEach((sceneEffect: any) => {
      this.obs.send('SetSceneItemProperties', {
        item: sceneEffect.sourceName,
        'scene-name': sceneEffect.sceneName,
        visible: false
      });
    });
  }

  public determineSceneEffectFromSound(soundEffect: string): any {
    // TODO: find scene effect from supported scene effect array based on the sound effect received
    // Note: effects.json will follow a schema that has mappings of sound effects to scene effects
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
