import { readEffects } from './file-manager';
import SoundFx from './sound-fx';
import ObsManager from './obs-manager';

export default class EffectsManager {
  private allEffects: any | undefined;
  private specialEffects: any | undefined;
  private alertEffects: any | undefined;
  private sceneEffects: any | undefined;

  constructor(private soundFx: SoundFx, private obsManager: ObsManager) {
    this.loadEffects();
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
    if (await this.soundFx.isSoundEffect(message)) {
      const soundEffect = await this.soundFx.determineSoundEffect(message);
      return this.soundFx.playSoundEffect(soundEffect);
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
}
