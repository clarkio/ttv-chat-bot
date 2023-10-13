import { injectable } from 'inversify';
import ObsWebSocket from 'obs-websocket-js';
import * as config from './config';
import { obsHandler as constants } from './constants';
import { log } from './log';

enum ObsRequests {
  SetCurrentProgramScene = 'SetCurrentProgramScene',
  GetCurrentProgramScene = 'GetCurrentProgramScene',
  GetSceneList = 'GetSceneList',
}

/**
 * An enum to provide flexibility in what effects can be applied within OBS. Since we're using obs-websockets there are plenty of options within its API that can be leveraged for effects. Using this enum will allow for a more simple process for adding new effects
 */
enum EffectType {
  None = '',
  SourceChange = 'SourceChange',
  SetSceneItemProperties = 'SetSceneItemProperties',
}

enum ObsErrors {
  ConnectionError = 'CONNECTION_ERROR',
}

type EffectTypeStrings = keyof typeof EffectType;

/**
 * A class to capture scene effect properties defined from the "effects.json" file
 */
export class SceneEffect {
  constructor(
    public name: string,
    public effectType: EffectType,
    public scenes: string[],
    public sources: SceneEffectSource[],
    public duration: number
  ) { }
}

/**
 * A class to capture scene effect source properties defined from the "effects.json" file for SetSceneItemProperties type effects
 */
export class SceneEffectSource {
  constructor(
    public name: string,
    public activeState: any,
    public inactiveState: any,
    public filterName?: string,
    public sourceName?: string
  ) { }
}

/**
 * A class to control initializing a websocket connection to the plugin within OBS as well as managing any effects to be applied within it.
 */
@injectable()
export default class ObsHandler {
  public sceneList: any;
  public sceneEffects: SceneEffect[] = new Array<SceneEffect>();
  private obs: ObsWebSocket;
  private activeSceneEffects: SceneEffect[] = new Array<SceneEffect>();
  private sceneEffectSettings?: any;
  private permittedScenesForCommand?: any;
  private sceneAliases?: any;
  private retryConnectionCount: number = 0;
  private retryConnectionLimit: number = 5;
  private retryConnectionWaitTime: number = 60000; // in milliseconds
  constructor() {
    this.obs = new ObsWebSocket();
  }

  public init(
    sceneEffectSettings: any,
    permittedScenesForCommand: any,
    sceneAliases: any
  ) {
    this.sceneEffectSettings = sceneEffectSettings;
    this.permittedScenesForCommand = permittedScenesForCommand;
    this.sceneAliases = sceneAliases;

    this.initSceneEffects();
    this.connectToObs();
    this.obs.on('ConnectionError', this.handleError);
  }

  /**
   * Finds the supported scene command (if any) associated with the message received from chat and executes the action for that command in OBS
   * @param message the raw text from the stream chat (without the command delimiter (such as '!'))
   */
  public executeSceneCommand(message: string) {
    // !scene <scene name>
    message = message
      .replace(`${constants.sceneCommand}`, '')
      .toLowerCase()
      .trim();

    const sceneToActivate = this.determineSceneFromMessage(message);
    if (sceneToActivate) {
      // tell OBS via websockets to activate the scene
      this.obs
        .call(ObsRequests.SetCurrentProgramScene, {
          sceneName: sceneToActivate.name,
        })
        .catch((error: any) => log('error', error));
    } else {
      log('info', 'Did not find a scene with the name provided');
    }
  }

  public isCameraCommand(message: string) {
    return message.startsWith(constants.camCommand);
  }

  private cameraSceneMap = new Map<number, string>([
    [1, '[C] Big Zoom Cam'],
    [2, '[C] Alt-Cam'],
    [3, '[C] Phone Cam 6s'],
    [4, '[C] Phone Cam X'],
  ]);

  // [14:35] FiniteSingularity: you should do a !cam next
  public async executeCameraCommand(message: string) {
    // cam 1
    message = message
      .replace(`${constants.camCommand}`, '')
      .toLowerCase()
      .trim();
    // 1
    let cameraNumber: number = 1;
    try {
      cameraNumber = parseInt(message, 10);
      if (cameraNumber > 4 || cameraNumber < 1 || isNaN(cameraNumber)) {
        const currentScene = await this.getCurrentScene();
        const currentCameraNumber = this.getKey(
          this.cameraSceneMap,
          currentScene
        );
        cameraNumber = (currentCameraNumber % 4) + 1;
      }
      // translate camera number to actual scene name
      const sceneName = this.cameraSceneMap.get(cameraNumber);
      this.obs
        .call(ObsRequests.SetCurrentProgramScene, {
          sceneName: sceneName || '',
        })
        .catch((error: any) => log('error', error));
    } catch (error) {
      console.error(`The camera number provided is not supported`);
      return;
    }
  }

  private getKey(map: Map<number, string>, value: string) {
    const key = [...map].find(([key, val]) => val == value);
    return key ? key[0] : 1;
  }

  public isScenePermitted(sceneName: string): boolean {
    return this.permittedScenesForCommand.some(
      (permittedScene: string) =>
        permittedScene.toLowerCase() === sceneName.toLowerCase()
    );
  }

  /**
   * Determines if the message received is a supported command for scene control
   * @param message the raw text from the stream chat (without the command delimiter (such as '!'))
   */
  public isSceneCommand(message: string): boolean {
    // !scene <scene name>
    return message.startsWith(constants.sceneCommand);
  }

  /**
   * Returns true if there is a corresponding scene effect based on the message received from the stream chat otherwise it returns false.
   * This is determined based on the names of effects read from the effects settings file "effects.json"
   * @param message the raw text from the stream chat (without the command delimiter (such as '!'))
   */
  public async isSceneEffect(message: string): Promise<boolean> {
    return this.sceneEffectSettings.some((sceneEffect: SceneEffect) =>
      sceneEffect.name.includes(message)
    );
  }

  /**
   * Returns the SceneEffect if one is found for the chat message received
   * @param message the raw text from the stream chat (without the command delimiter (such as '!'))
   */
  public async determineSceneEffect(message: string): Promise<SceneEffect> {
    return this.sceneEffectSettings.find((sceneEffect: SceneEffect) =>
      sceneEffect.name.includes(message)
    );
  }

  /**
   * Applies/activates/triggers the scene effect received in OBS based on the effect type, action and affected scenes (all part of SceneEffect class)
   * @param sceneEffect the scene effect to apply within OBS
   */
  public async applySceneEffect(sceneEffect: SceneEffect) {
    this.activateSceneEffect(sceneEffect).catch((error) => log('error', error));
  }

  /**
   * Returns the currently active scene that's visible in OBS via websockets
   */
  public async getCurrentScene(): Promise<string> {
    return this.obs
      .call(ObsRequests.GetCurrentProgramScene)
      .then((result: any) => {
        return result.currentProgramSceneName;
      })
      .catch((error: any) => {
        log('error', error);
        return '';
      });
  }

  public async activateSceneEffect(sceneEffect: SceneEffect): Promise<any> {
    this.activeSceneEffects.push(sceneEffect);

    const isForAllScenes = sceneEffect.scenes.some(
      (scene: string) => scene === '*'
    );
    const currentScene = isForAllScenes ? await this.getCurrentScene() : '';

    sceneEffect.scenes.forEach((scene: string) => {
      scene = isForAllScenes ? currentScene : scene;
      sceneEffect.sources.forEach((source: SceneEffectSource) => {
        this.obs
          .call('GetSceneItemId', {
            sceneName: scene,
            sourceName: source.name,
          })
          .then((item) => {
            this.obs.call('SetSceneItemEnabled', {
              sceneItemId: item.sceneItemId,
              sceneName: scene,
              sceneItemEnabled: true,
            });
          })
          .catch((error: any) => log('error', error));
      });
    });
  }

  public async setSourceFilterSettings(
    sourceName: string,
    filterName: string,
    filterSettings: any
  ) {
    return this.obs
      .call('SetSourceFilterSettings', {
        sourceName,
        filterName,
        filterSettings,
      })
      .then((result: any) => {
        return result;
      })
      .catch((error: any) => {
        log('error', error);
      });
  }

  public async resetSourceFilterSettings(
    sourceName: string,
    filterName: string,
    filterSettings: any
  ) {
    this.obs
      .call(
        'SetSourceFilterSettings',
        Object.assign(
          {},
          {
            sourceName,
            filterName,
            filterSettings,
          }
        )
      )
      .then((result: any) => {
        return result;
      })
      .catch((error: any) => {
        log('error', error);
      });
  }

  public async deactivateSceneEffect(sceneEffect: SceneEffect): Promise<any> {
    const index = this.activeSceneEffects.indexOf(sceneEffect);
    this.activeSceneEffects.splice(index, 1);

    const isForAllScenes = sceneEffect.scenes.some(
      (scene: string) => scene === '*'
    );
    const currentScene = isForAllScenes ? await this.getCurrentScene() : '';

    sceneEffect.scenes.forEach((scene: string) => {
      scene = isForAllScenes ? currentScene : scene;
      sceneEffect.sources.forEach((source: SceneEffectSource) => {
        this.obs
          .call('GetSceneItemId', {
            sceneName: scene,
            sourceName: source.name,
          })
          .then((item) => {
            this.obs.call('SetSceneItemEnabled', {
              sceneItemId: item.sceneItemId,
              sceneName: scene,
              sceneItemEnabled: false,
            });
          })
          .catch((error: any) => log('error', error));
      });
    });
  }

  public async toggleSceneSource(
    sourceName: string,
    sourceEnabled: boolean,
    sceneName?: string
  ) {
    try {
      const currentScene = sceneName ?? (await this.getCurrentScene());

      const sceneItem = await this.obs.call('GetSceneItemId', {
        sceneName: currentScene,
        sourceName: sourceName,
      });

      return this.obs.call('SetSceneItemEnabled', {
        sceneItemId: sceneItem.sceneItemId,
        sceneName: currentScene,
        sceneItemEnabled: sourceEnabled,
      });
    } catch (error: any) {
      log('error', error);
    }
  }

  public async deactivateAllSceneEffects(): Promise<any> {
    const currentScene = await this.getCurrentScene();
    this.activeSceneEffects.forEach((sceneEffect: SceneEffect) => {
      sceneEffect.scenes.forEach((scene: string) => {
        if (scene === '*') {
          scene = currentScene;
        }
        sceneEffect.sources.forEach((source: SceneEffectSource) => {
          this.obs
            .call('GetSceneItemId', {
              sceneName: scene,
              sourceName: source.name,
            })
            .then((item) => {
              this.obs.call('SetSceneItemEnabled', {
                sceneItemId: item.sceneItemId,
                sceneName: scene,
                sceneItemEnabled: false,
              });
            })
            .catch((error: any) => log('error', error));
          // Note: using Object.assign to merge the JSON objects together and allow for flexibility in applying the effect simply from the object found in the effects.json file
        });
      });
    });
    this.activeSceneEffects = new Array<SceneEffect>();
  }

  public determineSceneEffectByName(sceneEffectName: string): any {
    return this.sceneEffects.find(
      (sceneEffect: SceneEffect) => sceneEffect.name === sceneEffectName
    );
  }

  private async connectToObs(): Promise<void> {
    try {
      await this.obs.connect(config.obsSocketsServer, config.obsSocketsKey);
      log('log', constants.logs.obsConnectionSuccessfulMessage);
      this.getSceneList();
    } catch (error) {
      log(
        'error',
        `There was an issue when attempting to connect to the OBS websocket server`
      );
      this.handleObsConnectErrors(error);
    }
  }

  private handleObsConnectErrors(error: any): void {
    if (error.code === ObsErrors.ConnectionError) {
      log(
        'info',
        `OBS Websocket Connection Failed: Retrying connection in ${this.retryConnectionWaitTime / 1000
        } seconds`
      );

      this.retryConnectionCount++;
      if (this.retryConnectionCount >= this.retryConnectionLimit) return;

      setTimeout(this.connectToObs.bind(this), this.retryConnectionWaitTime);
    } else {
      log('error', error);
    }
  }

  private handleError(error: any): any {
    log('error', error);
  }

  private getSceneList() {
    this.obs
      .call(ObsRequests.GetSceneList)
      .then((data: any) => {
        this.sceneList = data.scenes;
      })
      .catch((error: any) => log('error', error));
  }

  /**
   * Maps scene effect settings from "effects.json" to a SceneEffect class for easy use later.
   * Note: effectType is case sensitive in mapping to an EffectType enum value
   */
  private initSceneEffects() {
    this.sceneEffectSettings.forEach((sceneEffectSetting: any) => {
      const sceneEffectType =
        EffectType[sceneEffectSetting.effectType as EffectTypeStrings] ||
        EffectType.None;

      const sceneEffect = new SceneEffect(
        sceneEffectSetting.name,
        sceneEffectType as EffectType,
        sceneEffectSetting.scenes,
        this.getSceneEffectSourcesForSetting(sceneEffectSetting.sources),
        sceneEffectSetting.duration
      );

      this.sceneEffects.push(sceneEffect);
    });
  }

  private getSceneEffectSourcesForSetting(sources: any[]) {
    return sources.map(
      (source: any) =>
        new SceneEffectSource(
          source.name,
          source.activeState,
          source.inactiveState,
          source.filterName,
          source.sourceName
        )
    );
  }

  private determineSceneFromMessage(message: string): any | undefined {
    message = message.toLowerCase();
    const sceneAlias = this.sceneAliases.find((alias: any) => alias[message]);
    const sceneName = sceneAlias ? sceneAlias[message].toLowerCase() : undefined;
    if (!sceneName) return undefined;
    return this.sceneList?.find(
      (scene: any) =>
        scene.sceneName?.toLowerCase().includes(sceneName) &&
        this.isScenePermitted(scene.sceneName || '')
    );
  }
}
