import { appendFile, existsSync, writeFile, readFile } from 'fs';
import { resolve as resolvePath } from 'path';

const CSS_FILE_NAME = resolvePath(
  `${__dirname}`,
  '../assets/custom-styles.css'
);
const EFFECTS_FILE_NAME = resolvePath(`${__dirname}`, './effects.json');

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

const handleFileActionCallback = (
  err: any,
  data: any,
  resolve: any,
  reject: any
) => {
  if (err) reject(err);
  else resolve(data);
};
