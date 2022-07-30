import io from 'socket.io';
import fetch from 'isomorphic-fetch';

import { container } from './container';
import { TYPES } from './types';
import { inject, injectable } from 'inversify';
import chroma from 'chroma-js';
import * as config from './config';
import { effectsManager as constants, StopCommands } from './constants';
import { readEffectsSync } from './file-handler';
import { log } from './log';
import TwitchUser from './twitch-user';
import ObsHandler, { SceneEffect } from './obs-handler';
import Overlay from './overlay';
import SoundFxManager, { SoundFxFile } from './sound-fx';
import TauApi from './tau-api';

@injectable()
export default class EffectsService {
  public socketServer!: io.Server;

  private allEffects: any | undefined;
  private specialEffects: any | undefined;
  private alertEffects: any | undefined;
  private sceneEffects: any | undefined;
  private soundEffectSettings: any | undefined;
  private permittedScenesForCommand: any | undefined;
  private sceneAliases: any | undefined;
  private soundFxManager!: SoundFxManager;
  private obsHandler!: ObsHandler;
  private overlay!: Overlay;
  private joinSoundEffects: any[] | undefined;
  private playedUserJoinSounds: string[] = [];
  private colorWaveEffectQueue: any[] = [];
  private isColorWaveActive: boolean = false;
  private isCameraCommandEnabled: boolean = false;
  private elgatoKeyLightStates: any[] = [];
  private elgatoKeyLightIps: string[] = [];
  private elgatoKeyLightFlashbangSetting: any = {
    numberOfLights: 1,
    lights: [
      {
        on: 1,
        brightness: 100,
        temperature: Math.round(987007 * 7000 ** -0.999),
      },
    ],
  };

  constructor(@inject(TYPES.TauApi) private tauApi: TauApi) {
    this.loadEffects();
    this.playedUserJoinSounds = [];
  }

  public setSocketServer(socket: io.Server) {
    this.socketServer = socket;
  }

  public emitEvent(event: string, args?: any) {
    this.socketServer.emit(event, args);
  }

  public activateJoinEffectIfFound(username: string) {
    const userEffect =
      this.joinSoundEffects &&
      this.joinSoundEffects.find((joinEffect) => joinEffect[username]);

    if (
      userEffect &&
      config.isSoundFxEnabled &&
      !this.hasJoinSoundPlayed(username)
    ) {
      const userSoundEffect = userEffect[username];
      this.activateSoundEffectByText(userSoundEffect);
      this.playedUserJoinSounds.push(username);
    }
  }

  /**
   * Updates the overlay used for the current scene that is active in OBS and on stream
   * @param commandMessage the text command received from chat that should be used to update the overlay for effects
   */
  public updateOverlay(commandMessage: string) {
    this.overlay.updateOverlay(commandMessage);
  }

  /**
   * Users the Overlay manager to change colors based on the triggered effect
   * @param colors an array of strings describing the written names of colors to use for the triggered effect
   */
  public triggerSpecialEffect(colors: string[]) {
    return this.overlay.triggerSpecialEffect(colors);
  }

  /**
   * Gets the current color being used in the overlay for the active scene
   */
  public getCurrentOverlayColor(): string {
    return this.overlay.getCurrentColor();
  }

  /**
   * Check if the chat message received is a defined special effect
   *
   * @param chatMessage the raw message parsed from chat
   * @returns object {
   *  type: 'eventType',
   *  colors: ['color1', 'color2', ...]
   * }
   */
  public determineSpecialEffect = (chatMessage: string): any | undefined => {
    const specialEffectKey = Object.keys(this.specialEffects).find(
      (specialEffect: string) => {
        return chatMessage.includes(specialEffect);
      }
    );

    return specialEffectKey
      ? this.specialEffects[specialEffectKey]
      : this.determineAlertEffect(chatMessage);
  };

  // TODO: abstract command checking/parsing work into a command parser class (commander?)
  public async checkForCommand(
    message: string,
    user: TwitchUser
  ): Promise<string | undefined> {
    // Remove the command prefix from the message (example: '!')
    message = message.replace(config.chatCommandPrefix, '');
    message =
      message === constants.robertTablesHeccEmote
        ? constants.heccSoundEffect
        : message;

    // Is it an effect stop command?
    if (this.soundFxManager.isAStopSoundCommand(message)) {
      const stopCommandUsed = this.soundFxManager.getStopCommandUsed(message);
      // TODO: do we really need !stopall event anymore since we're not queuing audio?
      switch (stopCommandUsed) {
        case StopCommands.Flush:
          this.socketServer!.emit(constants.stopAllAudioEvent);
          this.activateSoundEffectByText('flush');
          break;
        case StopCommands.StopAll:
          this.socketServer!.emit(constants.stopAllAudioEvent);
          break;
        default:
          this.socketServer!.emit(constants.stopCurrentAudioEvent);
          break;
      }

      this.obsHandler.deactivateAllSceneEffects();
    }

    // Is it a sound effect command?
    if (
      (await this.soundFxManager.isSoundEffect(message)) &&
      config.isSoundFxEnabled
    ) {
      const soundEffect = await this.soundFxManager.determineSoundEffect(
        message
      );
      if (!soundEffect) return;

      if (soundEffect.name === 'highfive') {
        const threeTwoOne = await this.soundFxManager.determineSoundEffect(
          'threetwoone'
        );
        if (threeTwoOne) {
          this.activateSoundEffectByText('threetwoone').then(() => {
            setTimeout(() => {
              this.activateSoundEffect(soundEffect);
            }, threeTwoOne.duration * 1000);
          });
        }
        return;
      }

      return await this.activateSoundEffect(soundEffect);
    }

    // Is it a scene effect command?
    if (
      (await this.obsHandler.isSceneEffect(message)) &&
      config.isSceneFxEnabled
    ) {
      // TODO: add to effects queue instead
      const sceneEffect = await this.obsHandler.determineSceneEffect(message);
      this.obsHandler
        .applySceneEffect(sceneEffect)
        .catch((error) => log('error', error));
      setTimeout(() => {
        this.obsHandler.deactivateSceneEffect(sceneEffect);
      }, sceneEffect.duration || 15000);
    }

    // Is it a scene control command?
    if (
      (await this.obsHandler.isSceneCommand(message)) &&
      config.isSceneFxEnabled
    ) {
      this.obsHandler.executeSceneCommand(message);
    }

    // Is it a camera control command?
    if (await this.obsHandler.isCameraCommand(message)) {
      if (user.isBroadcaster && this.checkCommandStatus('cam', message)) {
        return;
      }

      if (this.isCameraCommandEnabled) {
        this.obsHandler.executeCameraCommand(message);
        return;
      }
    }

    if (this.isFlashbangCommand(message)) {
      await this.executeFlashbangEffect();
      return;
    }

    // This return is a last resort
    return constants.unsupportedSoundEffectMessage;
  }

  private isFlashbangCommand(message: string) {
    message = message.toLowerCase().trim();
    return message === constants.flashBangCommand;
  }

  private checkCommandStatus(commandName: string, message: string) {
    if (this.obsHandler.isCameraCommand(commandName)) {
      message = message
        .replace(`${constants.camCommand}`, '')
        .toLowerCase()
        .trim();
      const isCommandStatusUpdate =
        message.includes('on') || message.includes('off');
      if (isCommandStatusUpdate) {
        this.isCameraCommandEnabled = message === 'on' ? true : false;
        return true;
      }
      return false;
    }
  }

  /**
   * Check if the event or message received is a defined alert effect
   *
   * @param event the event triggered for an alert (follow, subscribe, etc.) or manual trigger from chat message
   * @returns object {
   *  type: 'eventType',
   *  colors: ['color1', 'color2', ...]
   * }
   */
  public determineAlertEffect = (event: string): any | undefined => {
    const alertEffectKey = Object.keys(this.alertEffects).find(
      (alertEffect: string) => {
        return event === alertEffect;
      }
    );

    return alertEffectKey && this.alertEffects[alertEffectKey];
  };

  public async activateSceneEffectByName(effectName: string, options: any) {
    const effectToActivate =
      this.obsHandler.determineSceneEffectByName(effectName);
    if (
      effectToActivate &&
      effectToActivate.name === constants.cameraColorShadowEffectName &&
      options
    ) {
      if (chroma.valid(options.color)) {
        const hexColor = chroma(options.color).hex().substr(1);

        // calculate color for obs websocket plugin format
        // default to FF alpha because it seems to act unusually for certain colors anyway
        // Example: 00AD9F
        const red = hexColor.substr(0, 2);
        const blue = hexColor.substr(2, 2);
        const green = hexColor.substr(4, 2);
        const color = parseInt(`FF${green}${blue}${red}`, 16);
        const source = effectToActivate.sources[0];

        this.colorWaveEffectQueue.push({
          color,
          source,
          chatUser: options.chatUser,
        });

        return await this.triggerColorWaveEffect();
      } else {
        throw Error(`${options.color} is not a valid color`);
      }
    } else {
      return;
    }
  }

  private async triggerColorWaveEffect() {
    if (this.colorWaveEffectQueue.length > 0 && !this.isColorWaveActive) {
      this.isColorWaveActive = true;

      let { source, color } = this.colorWaveEffectQueue.shift() as any;
      // start with 0 opacity and work up to 100
      let opacity: number = 0;
      await this.obsHandler.setSourceFilterSettings(
        source.sourceName,
        source.filterName,
        { color, opacity }
      );

      await this.obsHandler.toggleSceneSource(source.sourceName, true);

      let fadeInterval = setInterval(async () => {
        opacity += config.cameraShadowOpacityModifier;
        await this.obsHandler.setSourceFilterSettings(
          source.sourceName,
          source.filterName,
          { opacity }
        );

        // In case the modifier causes it to have a value above 100
        if (opacity >= 100) {
          clearInterval(fadeInterval);
        }
      }, config.cameraShadowFadeDelayInMilliseconds);

      setTimeout(async () => {
        let fadeOutIntveral = setInterval(async () => {
          opacity -= config.cameraShadowOpacityModifier;
          await this.obsHandler.setSourceFilterSettings(
            source.sourceName,
            source.filterName,
            { opacity }
          );

          // In case the modifier causes it to have a value below zero
          if (opacity <= 0) {
            clearInterval(fadeOutIntveral);
            await this.obsHandler.toggleSceneSource(source.sourceName, false);
            this.isColorWaveActive = false;
            return await this.triggerColorWaveEffect();
          }
        }, config.cameraShadowFadeDelayInMilliseconds);
      }, config.cameraShadowDurationInMilliseconds);
    } else {
      // Effect completed
      return;
    }
  }

  private hasJoinSoundPlayed(username: string): boolean {
    return this.playedUserJoinSounds.includes(username);
  }

  private loadEffects = (): any => {
    const result = readEffectsSync();
    this.allEffects = JSON.parse(result);
    this.specialEffects = this.allEffects.specialEffects;
    this.alertEffects = this.allEffects.alertEffects;
    this.sceneEffects = this.allEffects.sceneEffects;
    this.soundEffectSettings = this.allEffects.soundEffects;
    this.permittedScenesForCommand = this.allEffects.permittedScenesForCommand;
    this.sceneAliases = this.allEffects.sceneAliases;
    this.joinSoundEffects = this.allEffects.joinSoundEffects;
    return;
  };

  private async activateSoundEffect(
    soundEffect: SoundFxFile
  ): Promise<string | undefined> {
    if (soundEffect) {
      if (soundEffect.setting && soundEffect.setting.sceneEffectName) {
        const sceneEffect = await this.obsHandler.determineSceneEffectByName(
          soundEffect.setting.sceneEffectName
        );
        if (sceneEffect) {
          this.activateSceneEffectFromSoundEffect(sceneEffect, soundEffect);
        }
      }
      this.socketServer!.emit(constants.playAudioEvent, soundEffect.fileName);
    }
    return;
  }

  private async activateSoundEffectByText(
    text: string
  ): Promise<SoundFxFile | undefined> {
    const soundEffect = await this.soundFxManager.determineSoundEffect(text);

    if (soundEffect) {
      if (soundEffect.setting && soundEffect.setting.sceneEffectName) {
        const sceneEffect = await this.obsHandler.determineSceneEffectByName(
          soundEffect.setting.sceneEffectName
        );
        if (sceneEffect) {
          this.activateSceneEffectFromSoundEffect(sceneEffect, soundEffect);
        }
      }

      this.socketServer!.emit(constants.playAudioEvent, soundEffect.fileName);
      return soundEffect;
    }

    return;
  }

  private activateSceneEffectFromSoundEffect(
    sceneEffect: SceneEffect,
    soundEffect: SoundFxFile
  ) {
    this.obsHandler
      .activateSceneEffect(sceneEffect)
      .catch((error) => log('error', error));
    // automatically deactivate the scene effect based on the duration of the corresponding sound effect that triggered it
    const duration = sceneEffect.duration || soundEffect.duration * 1000;
    if (!duration || duration < 400) {
      log(
        'warn',
        'A duration was either not available or too short (<400ms) for the effect so it will not be deactivated automatically'
      );
      return;
    }

    setTimeout(() => {
      this.obsHandler.deactivateSceneEffect(sceneEffect);
    }, duration);
  }

  public async executeFlashbangEffect() {
    // Set each light to the flashbang settings
    const fetchOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      mode: 'cors',
      body: JSON.stringify(this.elgatoKeyLightFlashbangSetting),
    };

    // Example URL path: http://192.168.1.1:9123/elgato/lights
    for (const ip of this.elgatoKeyLightIps) {
      try {
        // fetch the state of the light at that ip
        await fetch(`http://${ip}:9123/elgato/lights`, fetchOptions);
      } catch (error) {
        console.error(error);
      }
    }

    // Hold the lights to that status for X seconds?
    await new Promise((resolve, reject) => {
      setTimeout(() => this.resetFlashbangEffect(resolve), 500);
    });
  }

  private async resetFlashbangEffect(resolve: (value: unknown) => void) {
    const fetchOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      mode: 'cors',
    };

    // Example URL path: http://192.168.1.1:9123/elgato/lights
    for (let i = 0; i < this.elgatoKeyLightIps.length; i++) {
      try {
        // fetch the state of the light at that ip
        fetchOptions.body = JSON.stringify(this.elgatoKeyLightStates[i]);
        await fetch(
          `http://${this.elgatoKeyLightIps[i]}:9123/elgato/lights`,
          fetchOptions
        );
      } catch (error) {
        console.error(error);
      }
    }

    return resolve(true);
  }

  private async initializeFlashbangEffect() {
    // Read current state of the lights and store in memory
    this.elgatoKeyLightIps = config.elgatoKeyLightIps.split(',');

    const fetchOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
      mode: 'cors',
    };

    // Example URL path: http://192.168.1.1:9123/elgato/lights
    for (const ip of this.elgatoKeyLightIps) {
      try {
        // fetch the state of the light at that ip
        const state = await fetch(
          `http://${ip}:9123/elgato/lights`,
          fetchOptions
        );

        // store the state in this.elgatoKeyLightStates
        this.elgatoKeyLightStates.push(await state.json());
      } catch (error) {
        console.error(error);
      }
    }
  }

  private initializeEventListeners() {
    this.socketServer.on(
      'tts-done',
      this.tauApi.completeChannelPointRedemption
    );
  }

  /**
   * Initialize classes and functions that assist in controlling effects
   */
  public initEffectControllers = (): void => {
    // All effects will have been read from the file system at this point
    this.obsHandler = container.get<ObsHandler>(TYPES.ObsHandler);
    this.obsHandler.init(
      this.sceneEffects,
      this.permittedScenesForCommand,
      this.sceneAliases
    );

    this.soundFxManager = container.get<SoundFxManager>(TYPES.SoundFxManager);
    this.soundFxManager.init(this.soundEffectSettings);

    this.overlay = container.get<Overlay>(TYPES.Overlay);
    this.overlay.init(this.socketServer!);

    this.initializeFlashbangEffect();

    this.initializeEventListeners();
  };
}
