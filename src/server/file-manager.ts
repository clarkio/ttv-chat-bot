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
      appendFile(CSS_FILE_NAME, data, (err: any) =>
        handleFileActionCallback(err, data, resolve, reject)
      );
    });
  } else {
    return new Promise((resolve, reject) => {
      writeFile(CSS_FILE_NAME, data, (err: any) =>
        handleFileActionCallback(err, data, resolve, reject)
      );
    });
  }
}
export function readEffects(): Promise<string> {
  return new Promise((resolve, reject) => {
    readFile(EFFECTS_FILE_NAME, 'utf8', (err: any, data: any) =>
      handleFileActionCallback(err, data, resolve, reject)
    );
  });
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
