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
    this.loadEffects().then(this.initEffectControllers());
    this.startAzureBot();
  }

  public activateJoinEffectIfFound(username: string) {
    const userEffect = this.joinSoundEffects!.find(
      joinEffect => joinEffect[username]
    );

    if (userEffect) {
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

  // TODO: check to see if the chat message is a supported command
  // TODO: abstract command check type work into a command manager class
  public async checkForCommand(message: string): Promise<any> {
    // Remove the command prefix from the message (example: '!')
    message = message.replace(config.chatCommandPrefix, '');
    if (await this.soundFxManager.isSoundEffect(message)) {
      return await this.activateSoundEffect(message);
    }
    if (await this.obsManager.isSceneEffect(message)) {
      const sceneEffect = await this.obsManager.determineSceneEffect(message);
      this.obsManager.applySceneEffect(sceneEffect);
    }

    if (await this.obsManager.isSceneCommand(message)) {
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
      this.joinSoundEffects = this.allEffects.joinEffects;
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

  private async activateSoundEffect(message: string) {
    const soundEffect = await this.soundFxManager.determineSoundEffect(message);
    if (soundEffect.setting && soundEffect.setting.sceneEffectName) {
      const sceneEffect = await this.obsManager.determineSceneEffectByName(
        soundEffect.setting.sceneEffectName
      );
      if (sceneEffect) {
        this.obsManager.activateSceneEffect(sceneEffect, soundEffect.duration);
        // TODO: determine a way to automatically stop any scene effects that correspond to this sound effect when the sound effect is done
      }
    }
    // TODO: use corresponding soundEffect setting if available (to do things like control volume at which the sound is played)
    return this.soundFxManager.playSoundEffect(soundEffect.fileFullPath);
  }

  /**
   * Initialize classes that assist in controlling effects
   */
  private initEffectControllers():
    | ((value: any) => void | PromiseLike<void>)
    | null
    | undefined {
    return () => {
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
}
