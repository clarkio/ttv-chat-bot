import { appServer } from './index';

export class Overlay {
  public static readonly PORT: number = 1337;
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

  constructor() {
    //
  }

  /**
   * @returns The current Bulb Color
   */
  public getCurrentColor = (): string => this.currentBulbColor;

  /**
   * Based on a specific events, trigger a special effect
   *
   * @param message - The message sent in chat
   */
  public triggerSpecialEffect = (message: string): void => {
    let effect: string;
    if (message.includes('cop mode')) {
      effect = 'cop mode';
    } else if (
      message.includes('subscribe') ||
      message.includes('cheer') ||
      message.includes('tip')
    ) {
      effect = 'subscribe';
    } else {
      effect = 'follow';
    }
    // communicate with the client to cause effect
    appServer.io.emit('color-effect', effect);
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
