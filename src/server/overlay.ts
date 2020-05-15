import { overlay as constants } from './constants';

export default class OverlayManager {
  public static readonly PORT: number = constants.defaultPort;
  public currentBulbColor: string = constants.defaultColor;

  constructor(private io: SocketIO.Server) {}

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
      this.io.emit(constants.colorEffectEvent, colors);
    }
  };

  /**
   * Update the overlay to the given command
   *
   * @param command - What to change to overlay to
   */
  public updateOverlay = (command: string): void => {
    this.io.emit(constants.colorChangeEvent, command);
  };
}
