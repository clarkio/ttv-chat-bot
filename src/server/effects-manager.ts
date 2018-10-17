import { readEffects } from './file-manager';

export default class EffectsManager {
  allEffects: any | undefined;
  specialEffects: any | undefined;
  alertEffects: any | undefined;

  constructor() {
    this.loadEffects();
  }

  public determineSpecialEffect = (chatMessage: string): string | undefined => {
    const specialEffect = Object.keys(this.specialEffects).find(
      (specialEffect: string) => {
        return chatMessage.includes(specialEffect);
      }
    );

    return specialEffect || this.determineAlertEffect(chatMessage);
  };

  public determineAlertEffect = (event: string): string | undefined => {
    return Object.keys(this.alertEffects).find((alertEffect: string) => {
      return event === alertEffect;
    });
  };

  private loadEffects = () => {
    readEffects().then((result: any) => {
      this.allEffects = JSON.parse(result);
      this.specialEffects = this.allEffects.specialEffects;
      this.alertEffects = this.allEffects.alertEffects;
    });
  };
}
