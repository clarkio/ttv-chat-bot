import { readEffects } from './file-manager';
import SoundFxManager from './sound-fx';
import ObsManager from './obs-manager';
import OverlayManager from './overlay';
import * as config from './config';
import { AzureBot } from './azure-bot';
import { log } from './log';

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
  private obsManager!: ObsManager;
  private overlayManager!: OverlayManager;
  private joinSoundEffects: any[] | undefined;

  constructor() {
    this.loadEffects().then(this.initEffectControllers);
    this.startAzureBot();
  }

  public activateJoinEffectIfFound(username: string) {
    const userEffect =
      this.joinSoundEffects &&
      this.joinSoundEffects.find(joinEffect => joinEffect[username]);

    if (userEffect && config.isSoundFxEnabled) {
      const userSoundEffect = userEffect[username];
      this.activateSoundEffect(userSoundEffect);
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
    this.overlayManager.updateOverlay(commandMessage);
  }

  /**
   * Users the Overlay manager to change colors based on the triggered effect
   * @param colors an array of strings describing the written names of colors to use for the triggered effect
   */
  public triggerSpecialEffect(colors: string[]) {
    return this.overlayManager.triggerSpecialEffect(colors);
  }

  /**
   * Gets the current color being used in the overlay for the active scene
   */
  public getCurrentOverlayColor(): string {
    return this.overlayManager.getCurrentColor();
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

  // TODO: abstract command check type work into a command manager class
  public async checkForCommand(message: string): Promise<string | undefined> {
    // Remove the command prefix from the message (example: '!')
    message = message.replace(config.chatCommandPrefix, '');
    message = message === 'robert68hecc' ? 'hecc' : message;
    if (
      (await this.soundFxManager.isSoundEffect(message)) &&
      config.isSoundFxEnabled
    ) {
      return await this.activateSoundEffect(message);
    }
    if (
      (await this.obsManager.isSceneEffect(message)) &&
      config.isSceneFxEnabled
    ) {
      const sceneEffect = await this.obsManager.determineSceneEffect(message);
      this.obsManager.applySceneEffect(sceneEffect);
    }

    if (
      (await this.obsManager.isSceneCommand(message)) &&
      config.isSceneFxEnabled
    ) {
      this.obsManager.executeSceneCommand(message);
    }
    if (this.soundFxManager.isStopSoundCommand(message)) {
      this.soundFxManager.stopSounds();
      this.obsManager.deactivateAllSceneEffects();
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
    message: string
  ): Promise<string | undefined> {
    const soundEffect = await this.soundFxManager.determineSoundEffect(message);
    if (soundEffect) {
      if (soundEffect.setting && soundEffect.setting.sceneEffectName) {
        const sceneEffect = await this.obsManager.determineSceneEffectByName(
          soundEffect.setting.sceneEffectName
        );
        if (sceneEffect) {
          this.obsManager.activateSceneEffect(sceneEffect);
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
            this.obsManager.deactivateSceneEffect(sceneEffect);
          }, duration);
        }
      }

      // TODO: use corresponding soundEffect setting if available (to do things like control volume at which the sound is played)
      const result = await this.soundFxManager.playSoundEffect(
        soundEffect.fileFullPath
      );
      return result === true ? 'success!' : 'failed to play the sound effect';
    }

    log(
      'warn',
      'user entered an unsupported sound effect. Playing the sorry sound effect instead.'
    );

    const wrongEffect = await this.soundFxManager.determineSoundEffect('sorry'); // Using sorry for now since it seems fitting -ToeFrog

    if( wrongEffect ){
      const wrongResult = await this.soundFxManager.playSoundEffect(
        wrongEffect.fileFullPath
      );

      return wrongResult === true ? 'the sound effect you entered is not supported. Please double check your spelling or use the !sfx command to see what is supported' : 'failed to play the sorry sound effect';
    }

    // This return is a last resort
    return 'the sound effect you entered is not supported. Please double check your spelling or use the !sfx command to see what is supported';
  }

  /**
   * Initialize classes that assist in controlling effects
   */
  private initEffectControllers = (): void => {
    // All effects will have been read from the file system at this point
    this.obsManager = new ObsManager(
      this.sceneEffects,
      this.permittedScenesForCommand,
      this.sceneAliases
    );
    this.soundFxManager = new SoundFxManager(this.soundEffects);
    this.overlayManager = new OverlayManager(this.soundFxManager);
  };
}
