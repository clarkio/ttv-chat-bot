import { appendFile, existsSync, writeFile, readFile, readdir, readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';

const CSS_FILE_NAME = resolvePath(
  `${__dirname}`,
  '../../../assets/custom-styles.css'
);
const EFFECTS_FILE_FULL_PATH = resolvePath(
  `${__dirname}`,
  '../../effects.json'
);
const SOUND_FX_DIRECTORY = resolvePath(`${__dirname}`, '../../assets/sounds');

export function writeCssFile(data: any) {
  if (existsSync(CSS_FILE_NAME)) {
    return new Promise((resolve, reject) => {
      appendFile(CSS_FILE_NAME, data, (err: any) =>
        handleFileActionCallback(err, data, resolve, reject)
      );
    });
  }

  return new Promise((resolve, reject) => {
    writeFile(CSS_FILE_NAME, data, (err: any) =>
      handleFileActionCallback(err, data, resolve, reject)
    );
  });
}

export function readEffects(): Promise<string> {
  return new Promise((resolve, reject) => {
    readFile(EFFECTS_FILE_FULL_PATH, 'utf8', (err: any, data: any) =>
      handleFileActionCallback(err, data, resolve, reject)
    );
  });
}

export function readEffectsSync(): string {
  return readFileSync(EFFECTS_FILE_FULL_PATH, { encoding: 'utf8'});
}

export function getSoundEffectsFiles(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    readdir(SOUND_FX_DIRECTORY, (err: any, files: string[]) =>
      handleFileActionCallback(err, files, resolve, reject)
    );
  });
}

function handleFileActionCallback(
  err: any,
  data: any,
  resolve: any,
  reject: any
) {
  if (err) reject(err);
  else resolve(data);
}
