import { appendFile, existsSync, writeFile } from 'fs';
import { resolve as resolvePath } from 'path';

const FILE_NAME = resolvePath(__dirname, '../src/assets/custom-styles.css');

export function write(data: any) {
  if (existsSync(FILE_NAME)) {
    return new Promise((resolve, reject) => {
      appendFile(FILE_NAME, data, (err: any) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }
  return new Promise((resolve, reject) => {
    writeFile(FILE_NAME, data, (err: any) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}
