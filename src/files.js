const { writeFile, appendFile, existsSync } = require('fs');
const { resolve: resolvePath } = require('path');

const FILE_NAME = resolvePath(__dirname, '../src/assets/custom-styles.css');

module.exports = {
  write
};

function write(data) {
  if (existsSync(FILE_NAME)) {
    return new Promise((resolve, reject) => {
      appendFile(FILE_NAME, data, err => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }
  return new Promise((resolve, reject) => {
    writeFile(FILE_NAME, data, err => {
      if (err) reject(err);
      resolve(data);
    });
  });
}
