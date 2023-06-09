import { injectable } from 'inversify';
import { resolve as resolvePath } from 'path';
import { soundEffects as constants } from './constants';
import { getSoundEffectsFiles } from './file-handler';
import { log } from './log';

// tslint:disable: no-var-requires
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
  ) { }
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
  ) { }
}
@injectable()
export default class SoundFxManager {
  public SOUND_FX_DIRECTORY = resolvePath(
    `${__dirname}`,
    constants.soundsRelativeDirectory
  );
  private availableSoundEffects: SoundFxFile[] = new Array<SoundFxFile>();
  private soundEffectSettings?: any;

  public init (soundEffectSettings: any) {
    this.soundEffectSettings = soundEffectSettings;
    getSoundEffectsFiles()
      .then(this.mapFiles)
      .catch(error => {
        log('log', constants.logs.readFileError);
        log('error', error);
      });
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
