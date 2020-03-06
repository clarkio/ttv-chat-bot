import { resolve as resolvePath } from 'path';
import { soundEffects as constants } from './constants';
import { getSoundEffectsFiles } from './file-manager';
import { log } from './log';

// tslint:disable: no-var-requires
const player = require('play-sound')(constants.playSoundConfig);
const mp3Duration = require('mp3-duration');

/**
 * A class to capture properties for each mp3 file available within the sounds directory in this project
 */
export class SoundFxFile {
  constructor(
    public name: string,
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
  public SOUND_FX_DIRECTORY = resolvePath(
    `${__dirname}`,
    constants.soundsRelativeDirectory
  );
  private availableSoundEffects: SoundFxFile[] = new Array<SoundFxFile>();
  private currentlyPlayingAudio: any[] = new Array<any>();

  constructor(private soundEffectSettings: any | undefined) {
    getSoundEffectsFiles()
      .then(this.mapFiles)
      .catch(error => {
        log('log', constants.logs.readFileError);
        log('error', error);
      });
  }

  /**
   * Stops the currently play sounds/audio files
   */
  public stopSounds() {
    // this.currentlyPlayingAudio.forEach(audio => {
    //   audio.kill();
    // });
    // this.currentlyPlayingAudio = new Array<any>();
  }

  /**
   * A method to play an audio file based on the name. If you notice errors when attempting to play a sound make sure you have the audio file in this folder.
   * Note: this method is expected to be used after prior checking for the existence of the specified 'soundFileName'. If proper checks have not been done this will result in an error being thrown/returned.
   * @param soundFilePath the full path to the audio file with the extension (Example: c:/path/to/fart.mp3)
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
      soundEffect.fileName.includes(message.toLocaleLowerCase())
    );
  }

  public isAStopSoundCommand(message: string): boolean {
    return constants.stopCommands.some(command => message === command);
  }

  public getStopCommandUsed(message: string): string | undefined {
    return constants.stopCommands.find(command => message === command);
  }

  public async determineSoundEffect(
    message: string
  ): Promise<SoundFxFile | undefined> {
    const lowerCaseMessage = message.toLocaleLowerCase();
    return this.availableSoundEffects.find(
      (soundEffect: SoundFxFile) => soundEffect.name === lowerCaseMessage
    );
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
          log('error', error);
        }

        const name = fileName.replace('.mp3', '');
        const soundEffectSetting = this.soundEffectSettings.find(
          (setting: SoundFxSetting) => setting.name === name
        );
        const soundFxFile = new SoundFxFile(
          name,
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
