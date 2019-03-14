import { readEffects } from './file-manager';
import SoundFx from './sound-fx';
import ObsManager from './obs-manager';
import Overlay from './overlay';
import * as config from './config';
import { AzureBot } from './azure-bot';

export default class EffectsManager {
  public azureBot!: AzureBot;
  private allEffects: any | undefined;
  private specialEffects: any | undefined;
  private alertEffects: any | undefined;
  private sceneEffects: any | undefined;
  private soundFx: SoundFx;
  private obsManager: ObsManager;
  private overlay: Overlay;

  constructor() {
    this.soundFx = new SoundFx();
    this.obsManager = new ObsManager();
    this.overlay = new Overlay(this.soundFx);
    this.loadEffects();
    this.startAzureBot();
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

  // TODO: check to see if the chat message is a supported command
  // TODO: abstract command check type work into a command manager class
  public async checkForCommand(message: string): Promise<any> {
    // TODO: check if sound effect has corresponding scene effects (and maybe others in the future). Example: !pbjtime plays sound and shows dancing banana source in scene
    if (await this.soundFx.isSoundEffect(message)) {
      const soundEffect = await this.soundFx.determineSoundEffect(message);
      return this.soundFx.playSoundEffect(soundEffect);
    }
    if (this.soundFx.isStopSoundCommand(message)) {
      this.soundFx.stopSounds();
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

  private loadEffects = () => {
    readEffects().then((result: any) => {
      this.allEffects = JSON.parse(result);
      this.specialEffects = this.allEffects.specialEffects;
      this.alertEffects = this.allEffects.alertEffects;
      this.sceneEffects = this.alertEffects.sceneEffects;
    });
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
}
