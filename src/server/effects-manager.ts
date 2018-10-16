import { readEffects } from './file-manager';

export default class EffectsManager {
  effects: any | undefined;

  constructor() {
    this.loadEffects();
  }

  public determineSpecialEffect = (message: string): string | undefined => {
    return Object.keys(this.effects.specialEffects).find(
      (specialEffect: string) => {
        return message.includes(specialEffect);
      }
    );
  };

  private loadEffects = () => {
    readEffects().then((result: any) => {
      this.effects = JSON.parse(result);
    });
  };
}
