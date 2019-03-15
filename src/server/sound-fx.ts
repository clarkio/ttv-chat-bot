import { getSoundEffectsFiles } from './file-manager';
import { resolve as resolvePath } from 'path';

// tslint:disable: no-var-requires
const player = require('play-sound')({});
// TODO: Switch this ^^^ to use node-mp3-player to which allows volumne control
const mp3Duration = require('mp3-duration');

/**
 * A class to capture properties for each mp3 file available within the sounds directory in this project
 */
export class SoundFxFile {
  constructor(
    public fileName: string,
    public fileFullPath: string,
    public duration: number,
    public setting?: SoundFxSetting
  ) {}
}

/**
 * A class to capture any sound effect settings found in the configuration file "effects.json". This configuration file defines effect properties (such as volume) and/or corresponding effects outside of sounds that are associated with it (such as scene effects in OBS)
 */
export class SoundFxSetting {
  constructor(
    public name: string,
    public fileName: string,
    public sceneEffectName: string | undefined,
    public volume: number | 1
  ) {}
}

export default class SoundFxManager {
  private SOUND_FX_DIRECTORY = resolvePath(`${__dirname}`, '../assets/sounds');
  private availableSoundEffects: SoundFxFile[] = new Array<SoundFxFile>();
  private stopSoundCommand = '!stop';
  private currentlyPlayingAudio: any[] = new Array<any>();

  constructor(private soundEffectSettings: any | undefined) {
    getSoundEffectsFiles()
      .then(this.mapFiles)
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
    this.currentlyPlayingAudio = new Array<any>();
  }

  /**
   * A method to play an audio file based on the name. The name is prefixed with the calculated path to the "assets/sounds" folder built with this project. If you notice errors when attempting to play a sound make sure you have the audio file in this folder.
   * Note: this method is expected to be used after prior checking for the existence of the specified 'soundFileName'. If proper checks have not been done this will result in an error being thrown/returned.
   * @param soundFilePath the full path to the audio file with the extension (Example: fart.mp3)
   */
  public async playSoundEffect(soundFilePath: string): Promise<any> {
    try {
      return await this.playAudioFile(soundFilePath);
    } catch (error) {
      return error;
    }
  }

  public async isSoundEffect(message: string): Promise<boolean> {
    return this.availableSoundEffects.some((soundEffect: SoundFxFile) =>
      soundEffect.fileName.includes(message)
    );
  }

  public isStopSoundCommand(message: string): boolean {
    return this.stopSoundCommand.includes(message);
  }

  public async determineSoundEffect(message: string): Promise<SoundFxFile> {
    return this.availableSoundEffects.filter((soundEffect: SoundFxFile) =>
      soundEffect.fileName.includes(message)
    )[0];
  }

  private async playAudioFile(file: string): Promise<boolean> {
    const audio = await player.play(file, (error: any) => {
      if (error) throw error;
    });
    this.currentlyPlayingAudio.push(audio);
    return true;
  }

  private mapFiles = (files: string[]) => {
    // Array.forEach is blocking aka synchronous
    files.forEach((fileName: string) => {
      const fileFullPath = `${this.SOUND_FX_DIRECTORY}/${fileName}`;
      mp3Duration(fileFullPath, (error: any, duration: any) => {
        if (error) {
          console.error(error);
        }
        const soundEffectSetting = this.soundEffectSettings.find(
          (setting: SoundFxSetting) =>
            setting.name === fileName.replace('.mp3', '')
        );
        const soundFxFile = new SoundFxFile(
          fileName,
          fileFullPath,
          duration,
          soundEffectSetting
        );
        this.availableSoundEffects.push(soundFxFile);
      });
    });
  };
}
