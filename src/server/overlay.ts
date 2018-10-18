import { appServer } from './index';
import EffectsManager from './effects-manager';

export class Overlay {
  public static readonly PORT: number = 1337;
  // TODO: determine better way to define these such as env vars
  public supportedOverlayColors: string[] = [
    'blue',
    'red',
    'green',
    'purple',
    'pink',
    'yellow',
    'orange',
    'teal',
    'black',
    'gray',
    'white'
  ];
  public currentBulbColor: string = 'blue';
  private effectsManager: EffectsManager;

  constructor() {
    this.effectsManager = new EffectsManager();
  }

  /**
   * @returns The current Bulb Color
   */
  public getCurrentColor = (): string => this.currentBulbColor;

  /**
   * Based on a specific events, trigger a special effect
   *
   * @param colors - An array of strings with the color names to use in the overlay effect. These must match the CSS classes you have in either /assets/styles.css or /assets/custom-styles.css
   */
  public triggerSpecialEffect = (colors: string[]): void => {
    if (colors) {
      appServer.io.emit('color-effect', colors);
    }
  };

  /**
   * Update the overlay to the given command
   *
   * @param command - What to change to overlay to
   */
  public updateOverlay = (command: string): void => {
    this.supportedOverlayColors.forEach((color: string) => {
      if (command.includes(color)) {
        this.currentBulbColor = color;
        // communicate with the client to change overlay color
        appServer.io.emit('color-change', color);
      }
    });
  };
}
