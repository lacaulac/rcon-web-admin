
const fs = require('fs');

/**
 * FS helper tools
 */
const fstools = {};

/**
 * Delete directories and files recursive
 * Use with caution
 * @param {string} path
 */
fstools.deleteRecursive = function (path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) {
        fstools.deleteRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

module.exports = fstools;
