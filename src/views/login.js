
const db = require(`${__dirname}/../db`);
const hash = require(`${__dirname}/../hash`);

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
const View = function (user, messageData, callback) {
  if (messageData.form == 'login' && messageData.btn == 'login') {
    const { formData } = messageData;
    if (formData.username && formData.password) {
      const pwHash = hash.saltedMd5(formData.password);
      const userData = db.get('users').find({
        username: formData.username,
        password: pwHash,
      }).cloneDeep().value();
      if (userData) {
        callback({
          sessionUserData: { username: userData.username, loginHash: userData.loginHash },
          login: formData.remember == 'yes' ? 'local' : 'session',
          note: { message: 'login.success', type: 'success' },
        });
        return;
      }
    }
    callback({ note: { message: 'login.failed', type: 'danger' }, redirect: 'login' });
    return;
  }
  callback({});
};

module.exports = View;
