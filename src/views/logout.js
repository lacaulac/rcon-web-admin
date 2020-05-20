
/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
const View = function (user, messageData, callback) {
  user.userData = null;
  callback({ note: { message: 'logout.title', type: 'success' } });
};

module.exports = View;
