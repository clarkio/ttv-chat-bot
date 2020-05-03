import { AzureBot } from './azure-bot';
import * as config from './config';
import { effectsManager as constants, StopCommands } from './constants';
import { readEffects } from './file-handler';
import { log } from './log';
import ObsHandler, { SceneEffect } from './obs-handler';
import Overlay from './overlay';
import { AppServer } from './server';
import SoundFxManager, { SoundFxFile } from './sound-fx';

export default class EffectsManager {
  public azureBot!: AzureBot;
  private allEffects: any | undefined;
  private specialEffects: any | undefined;
  private alertEffects: any | undefined;
  private sceneEffects: any | undefined;
  private soundEffects: any | undefined;
  private permittedScenesForCommand: any | undefined;
  private sceneAliases: any | undefined;
  private soundFxManager!: SoundFxManager;
  private obsHandler!: ObsHandler;
  private overlay!: Overlay;
  private joinSoundEffects: any[] | undefined;
  private playedUserJoinSounds: string[] = [];

  constructor(private appServer: AppServer) {
    this.loadEffects().then(this.initEffectControllers);
    this.startAzureBot();
    this.playedUserJoinSounds = [];
  }

  public activateJoinEffectIfFound(username: string) {
    const userEffect =
      this.joinSoundEffects &&
      this.joinSoundEffects.find(joinEffect => joinEffect[username]);

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

  public triggerAzureBotEffect(alertEffect: any, userName: string) {
    if (this.azureBot) {
      return this.azureBot.triggerEffect(alertEffect, userName);
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
  public async checkForCommand(message: string): Promise<string | undefined> {
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
          this.appServer.io.emit(constants.stopAllAudioEvent);
          this.activateSoundEffectByText('flush');
          break;
        case StopCommands.StopAll:
          this.appServer.io.emit(constants.stopAllAudioEvent);
          break;
        default:
          this.appServer.io.emit(constants.stopCurrentAudioEvent);
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
      this.obsHandler.applySceneEffect(sceneEffect);
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

    // This return is a last resort
    return constants.unsupportedSoundEffectMessage;
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

  private hasJoinSoundPlayed(username: string): boolean {
    return this.playedUserJoinSounds.includes(username);
  }

  private loadEffects = async (): Promise<any> => {
    try {
      const result = await readEffects();
      this.allEffects = JSON.parse(result);
      this.specialEffects = this.allEffects.specialEffects;
      this.alertEffects = this.allEffects.alertEffects;
      this.sceneEffects = this.allEffects.sceneEffects;
      this.soundEffects = this.allEffects.soundEffects;
      this.permittedScenesForCommand = this.allEffects.permittedScenesForCommand;
      this.sceneAliases = this.allEffects.sceneAliases;
      this.joinSoundEffects = this.allEffects.joinSoundEffects;
      return;
    } catch (error) {
      log('error', error);
      return;
    }
  };

  /**
   * Create the AzureBot
   */
  private startAzureBot = () => {
    if (config.azureBotEnabled) {
      this.azureBot = new AzureBot();
      this.azureBot.createNewBotConversation();
    }
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
      this.appServer.io.emit(constants.playAudioEvent, soundEffect.fileName);
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

      this.appServer.io.emit(constants.playAudioEvent, soundEffect.fileName);
      return soundEffect;
    }

    return;
  }

  private activateSceneEffectFromSoundEffect(
    sceneEffect: SceneEffect,
    soundEffect: SoundFxFile
  ) {
    this.obsHandler.activateSceneEffect(sceneEffect);
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

  /**
   * Initialize classes that assist in controlling effects
   */
  private initEffectControllers = (): void => {
    // All effects will have been read from the file system at this point
    this.obsHandler = new ObsHandler(
      this.sceneEffects,
      this.permittedScenesForCommand,
      this.sceneAliases
    );
    this.soundFxManager = new SoundFxManager(this.soundEffects);
    this.overlay = new Overlay(this.appServer.io);
  };
}
