import { app } from './index';

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

  public getCurrentColor = (): string => this.currentBulbColor;

  public getSocket = (): SocketIO.Server => app.io;

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
    app.io.emit('color-effect', effect);
  };

  public updateOverlay = (command: string): void => {
    this.supportedOverlayColors.forEach((color: string) => {
      if (command.includes(color)) {
        this.currentBulbColor = color;
        app.io.emit('color-change', color);
      }
    });
  };
}
