import { getSoundEffectsFiles } from './file-manager';
import { resolve as resolvePath } from 'path';

// tslint:disable: no-var-requires
const player = require('play-sound')({});

export default class SoundFx {
  private SOUND_FX_DIRECTORY = resolvePath(`${__dirname}`, '../assets/sounds');
  private availableSoundEffects: string[] = new Array<string>();
  private stopSoundCommand = '!stop';
  private currentlyPlayingAudio: any[] = new Array<any>();

  constructor() {
    getSoundEffectsFiles()
      .then(files => {
        this.availableSoundEffects = files;
      })
      .catch(error => {
        console.log(
          'There was an error attempting to read sound effects files'
        );
        console.error(error);
      });
  }

  /**
   * Stops the currently play sounds/audio files
   */
  public stopSounds() {
    this.currentlyPlayingAudio.forEach(audio => {
      audio.kill();
    });
  }

  /**
   * A method to play an audio file based on the name. The name is prefixed with the calculated path to the "assets/sounds" folder built with this project. If you notice errors when attempting to play a sound make sure you have the audio file in this folder.
   * Note: this method is expected to be used after prior checking for the existence of the specified 'soundFileName'. If proper checks have not been done this will result in an error being thrown/returned.
   * @param soundFileName the name of the audio file with extension (Example: fart.mp3)
   */
  public async playSoundEffect(soundFileName: string): Promise<any> {
    try {
      return await this.playAudioFile(
        `${this.SOUND_FX_DIRECTORY}/${soundFileName}`
      );
    } catch (error) {
      return error;
    }
  }

  public async isSoundEffect(message: string): Promise<boolean> {
    return this.availableSoundEffects.some((soundFile: string) =>
      soundFile.includes(message)
    );
  }

  public isStopSoundCommand(message: string): boolean {
    return this.stopSoundCommand.includes(message);
  }

  public async determineSoundEffect(message: string): Promise<string> {
    return this.availableSoundEffects.filter((soundEffect: string) =>
      soundEffect.includes(message)
    )[0];
  }

  private async playAudioFile(file: string): Promise<boolean> {
    const audio = await player.play(file, (error: any) => {
      if (error) throw error;
    });
    this.currentlyPlayingAudio.push(audio);
    return true;
  }
}
