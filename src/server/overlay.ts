import SoundFxManager from './sound-fx';

export default class OverlayManager {
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
  public currentBulbColor: string = 'deepskyblue';

  constructor(private soundFx: SoundFxManager, private io: SocketIO.Server) {}

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
      this.io.emit('color-effect', colors);
      if (colors[0].includes('cop')) {
        this.soundFx.playSoundEffect(
          `${this.soundFx.SOUND_FX_DIRECTORY}/beedoo.mp3`
        );
      }
    }
  };

  /**
   * Update the overlay to the given command
   *
   * @param command - What to change to overlay to
   */
  public updateOverlay = (command: string): void => {
    this.io.emit('color-change', command);
  };
}
