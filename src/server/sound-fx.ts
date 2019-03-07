import { getSoundEffects } from './file-manager';
import { resolve as resolvePath } from 'path';

// tslint:disable: no-var-requires
const player = require('play-sound')({});

export default class SoundFx {
  private SOUND_FX_DIRECTORY = resolvePath(`${__dirname}`, '../assets/sounds');
  private availableSoundEffects: string[] = new Array<string>();

  constructor() {
    getSoundEffects()
      .then(files => {
        this.availableSoundEffects = files;
      })
      .catch(error => {
        console.log('Unable to read sound effects files');
        console.error(error);
      });
  }

  public async playSoundEffect(message: string) {
    try {
      const soundEffect = this.determineSoundEffect(message);
      return await this.playAudioFile(
        `${this.SOUND_FX_DIRECTORY}/${soundEffect}`
      );
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  private async playAudioFile(file: string) {
    try {
      await player.play(file, (error: any) => {
        if (error) throw error;
        return true;
      });
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  private determineSoundEffect(message: string): string {
    return this.availableSoundEffects.filter((soundEffect: string) =>
      soundEffect.includes(message)
    )[0];
  }
}
