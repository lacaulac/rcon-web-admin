
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
function View(user, messageData, callback) {
  // access denied for everyone except admin
  if (!user.userData || !user.userData.admin) {
    callback({ redirect: 'index', note: { message: 'login.failed', type: 'danger' } });
    return;
  }
  const logdir = `${__dirname}/../../logs`;
  if (messageData.action == 'update') {
    if (os.platform() != 'linux') {
      callback({ message: 'settings.update.error.platform', type: 'danger' });
      return;
    }
    const dir = `${__dirname}/../..`;
    exec(`cd ${dir} && sh startscripts/start-linux.sh stop && node src/main.js update-core && startscripts/start-linux.sh start`, null, () => {
      callback({ message: 'widgets.update.progress', type: 'info' });
    });
    return;
  }
  if (messageData.action == 'logfiles') {
    fs.stat(logdir, (err) => {
      if (err) {
        if (callback) callback();
        return;
      }
      fs.readdir(logdir, (err, files) => {
        const filesArr = [];
        for (var i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.substr(0, 1) == '.') continue;
          try {
            const stats = fs.statSync(`${logdir}/${file}`);
            filesArr.push({ file, time: stats.mtime, size: stats.size });
          } catch (e) {

          }
        }
        filesArr.sort((a, b) => {
          if (a.file > b.file) {
            return -1;
          }
          return 1;
        });
        for (let j = 10; j < filesArr.length; j++) {
          fs.unlink(`${logdir}/${filesArr[j].file}`, () => {

          });
          delete filesArr[i];
        }
        if (callback) callback({ files: filesArr });
      });
    });
    return;
  }
  if (messageData.action == 'download') {
    const file = `${logdir}/${messageData.file.replace(/\/\\/g, '')}`;
    fs.stat(file, (err) => {
      if (err) {
        callback({ content: '' });
        return;
      }
      fs.readFile(file, 'utf8', (err, data) => {
        if (data.length > 1024 * 1024) {
          data = data.substr(-(1024 * 1024 * 0.8));
          fs.writeFile(file, data, () => {

          });
        }
        callback({ content: data });
      });
    });
    return;
  }
  callback();
}

module.exports = View;
