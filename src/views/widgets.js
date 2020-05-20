
const Widget = require(`${__dirname}/../widget`);
const os = require('os');
const { exec } = require('child_process');

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
    callback({ redirect: 'index', note: { message: 'access.denied', type: 'danger' } });
    return;
  }
  let widget = null;
  const dir = `${__dirname}/../..`;
  switch (messageData.action) {
    case 'install':
      if (os.platform() != 'linux') {
        callback({ message: 'widgets.install.error.platform', type: 'danger' });
        return;
      }
      exec(`cd ${dir} && sh startscripts/start-linux.sh stop && node src/main.js install-widget ${messageData.widget} && startscripts/start-linux.sh start`, null, () => {
        callback({ message: 'widgets.update.progress', type: 'info' });
      });
      break;
    case 'update':
      widget = Widget.get(messageData.widget);
      if (os.platform() != 'linux' || !widget) {
        callback({ message: 'widgets.update.error.platform', type: 'danger' });
        return;
      }
      exec(`cd ${dir} && sh startscripts/start-linux.sh stop && node src/main.js install-widget ${widget.manifest.repository} && startscripts/start-linux.sh start`, null, () => {
        callback({ message: 'widgets.update.progress', type: 'info' });
      });
      break;
    default:
      var widgets = {};
      // get all widgets
      (function () {
        const allWidgets = Widget.getAllWidgets();
        for (const allWidgetsIndex in allWidgets) {
          if (allWidgets.hasOwnProperty(allWidgetsIndex)) {
            const allWidgetsRow = allWidgets[allWidgetsIndex];
            widgets[allWidgetsRow.id] = allWidgetsRow.manifest;
          }
        }
      }());
      callback({
        widgets,
      });
  }
}

module.exports = View;
