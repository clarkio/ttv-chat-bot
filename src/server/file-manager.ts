import { appendFile, existsSync, writeFile, readFile, readdir } from 'fs';
import { resolve as resolvePath } from 'path';

const CSS_FILE_NAME = resolvePath(
  `${__dirname}`,
  '../assets/custom-styles.css'
);
const EFFECTS_FILE_NAME = resolvePath(`${__dirname}`, './effects.json');
const SOUND_FX_DIRECTORY = resolvePath(`${__dirname}`, '../assets/sounds');

export function writeCssFile(data: any) {
  if (existsSync(CSS_FILE_NAME)) {
    return new Promise((resolve, reject) => {
      appendFile(CSS_FILE_NAME, data, (err: any) => {
        return handleFileActionCallback(err, data, resolve, reject);
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      writeFile(CSS_FILE_NAME, data, (err: any) => {
        return handleFileActionCallback(err, data, resolve, reject);
      });
    });
  }
}
export function readEffects() {
  return new Promise((resolve, reject) => {
    readFile(EFFECTS_FILE_NAME, 'utf8', (err: any, data: any) => {
      return handleFileActionCallback(err, data, resolve, reject);
    });
  });
}

export function getSoundEffects(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    readdir(SOUND_FX_DIRECTORY, (err: any, files: string[]) => {
      return handleFileActionCallback(err, files, resolve, reject);
    });
  });
}

const handleFileActionCallback = (
  err: any,
  data: any,
  resolve: any,
  reject: any
) => {
  if (err) reject(err);
  else resolve(data);
};
