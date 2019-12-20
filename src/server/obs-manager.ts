import ObsWebSocket from 'obs-websocket-js';
import * as config from './config';
import { obsManager as constants } from './constants';
import { log } from './log';

enum ObsRequests {
  SetCurrentScene = 'SetCurrentScene',
  GetCurrentScene = 'GetCurrentScene',
  GetSceneList = 'GetSceneList'
}

/**
 * An enum to provide flexibility in what effects can be applied within OBS. Since we're using obs-websockets there are plenty of options within its API that can be leveraged for effects. Using this enum will allow for a more simple process for adding new effects
 */
enum EffectType {
  None = '',
  SourceChange = 'SourceChange',
  SetSceneItemProperties = 'SetSceneItemProperties'
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
  ) {}
}

/**
 * A class to capture scene effect source properties defined from the "effects.json" file for SetSceneItemProperties type effects
 */
export class SceneEffectSource {
  constructor(
    public name: string,
    public activeState: any,
    public inactiveState: any
  ) {}
}

/**
 * A class to control initializing a websocket connection to the plugin within OBS as well as managing any effects to be applied within it.
 */
export default class ObsManager {
  public sceneList: any;
  public sceneEffects: SceneEffect[] = new Array<SceneEffect>();
  private obs: ObsWebSocket;
  private activeSceneEffects: SceneEffect[] = new Array<SceneEffect>();

  constructor(
    private sceneEffectSettings: any | undefined,
    private permittedScenesForCommand: any | undefined,
    private sceneAliases: any | undefined
  ) {
    this.initSceneEffects();
    this.obs = new ObsWebSocket();
    this.obs
      .connect({
        address: config.obsSocketsServer,
        password: config.obsSocketsKey
      })
      .then(() => {
        log('log', constants.logs.obsConnectionSuccessfulMessage);
        this.getSceneList();
      })
      .catch(this.handleError);

    this.obs.on('error', this.handleError);
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
        .send(ObsRequests.SetCurrentScene, {
          'scene-name': sceneToActivate.name
        })
        .catch((error: any) => log('error', error));
    }
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
    this.activateSceneEffect(sceneEffect);
  }

  /**
   * Returns the currently active scene that's visible in OBS via websockets
   */
  public async getCurrentScene(): Promise<string> {
    return this.obs.send(ObsRequests.GetCurrentScene);
  }

  public async activateSceneEffect(sceneEffect: SceneEffect): Promise<any> {
    this.activeSceneEffects.push(sceneEffect);

    const isForAllScenes = sceneEffect.scenes.some(
      (scene: string) => scene === '*'
    );
    const currentScene = isForAllScenes
      ? await this.getCurrentScene()
      : undefined;

    sceneEffect.scenes.forEach((scene: string | undefined) => {
      scene = isForAllScenes ? currentScene : scene;
      sceneEffect.sources.forEach((source: SceneEffectSource) => {
        this.obs
          .send(
            sceneEffect.effectType,
            Object.assign(
              {},
              {
                item: source.name,
                'scene-name': scene
              },
              source.activeState
            )
          )
          .catch((error: any) => log('error', error));
      });
    });
  }

  public async deactivateSceneEffect(sceneEffect: SceneEffect): Promise<any> {
    const index = this.activeSceneEffects.indexOf(sceneEffect);
    this.activeSceneEffects.splice(index, 1);

    const isForAllScenes = sceneEffect.scenes.some(
      (scene: string) => scene === '*'
    );
    const currentScene = isForAllScenes
      ? await this.getCurrentScene()
      : undefined;

    sceneEffect.scenes.forEach((scene: string | undefined) => {
      scene = isForAllScenes ? currentScene : scene;
      sceneEffect.sources.forEach((source: SceneEffectSource) => {
        // Note: using Object.assign to merge the JSON objects together and allow for flexibility in applying the effect simply from the object found in the effects.json file
        this.obs
          .send(
            sceneEffect.effectType,
            Object.assign(
              {},
              {
                item: source.name,
                'scene-name': scene
              },
              source.inactiveState
            )
          )
          .catch((error: any) => log('error', error));
      });
    });
  }

  public async deactivateAllSceneEffects(): Promise<any> {
    const currentScene = await this.getCurrentScene();
    this.activeSceneEffects.forEach((sceneEffect: SceneEffect) => {
      sceneEffect.scenes.forEach((scene: string) => {
        if (scene === '*') {
          scene = currentScene;
        }
        sceneEffect.sources.forEach((source: SceneEffectSource) => {
          // Note: using Object.assign to merge the JSON objects together and allow for flexibility in applying the effect simply from the object found in the effects.json file
          this.obs
            .send(
              sceneEffect.effectType,
              Object.assign(
                {},
                {
                  item: source.name,
                  'scene-name': scene
                },
                source.inactiveState
              )
            )
            .catch((error: any) => log('error', error));
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

  private handleError(error: any): any {
    log('error', error);
  }

  private getSceneList() {
    this.obs.send(ObsRequests.GetSceneList).then((data: any) => {
      this.sceneList = data.scenes;
    });
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
          source.inactiveState
        )
    );
  }

  private determineSceneFromMessage(message: string): any | undefined {
    message = message.toLowerCase();
    const sceneAlias = this.sceneAliases.find((alias: any) => alias[message]);
    message = sceneAlias ? sceneAlias[message].toLowerCase() : message;
    return this.sceneList.find(
      (scene: any) =>
        scene.name.toLowerCase().includes(message) &&
        this.isScenePermitted(scene.name)
    );
  }
}
