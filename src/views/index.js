
const db = require(`${__dirname}/../db`);
const fs = require('fs');

const hash = require(`${__dirname}/../hash`);
const Widget = require(`${__dirname}/../widget`);

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
const View = function (user, messageData, callback) {
  const myServers = {};
  let currentServer = user.getServerById(messageData.server);
  if (currentServer && !currentServer.connected) currentServer = null;
  const widgets = {};
  const servers = db.get('servers').cloneDeep().value();
  let wdb = null;
  if (currentServer) wdb = db.get('widgets', `server_${messageData.server}`);
  const deeperCallback = function (sendMessageData) {
    sendMessageData.widgets = widgets;
    sendMessageData.myServers = myServers;
    if (currentServer) {
      const myWidgets = wdb.get('list').cloneDeep().value();
      sendMessageData.gridrows = wdb.get('gridrows').value();
      sendMessageData.myWidgets = [];
      if (myWidgets) {
        for (let i = 0; i < myWidgets.length; i++) {
          const widgetData = myWidgets[i];
          const widget = Widget.get(widgetData.id);
          if (widget) {
            widgetData.manifest = sendMessageData.widgets[widget.id];
            sendMessageData.myWidgets.push(widgetData);
          }
        }
      }
      sendMessageData.server = messageData.server;
      sendMessageData.serverConnected = currentServer && currentServer.connected;
    }
    callback(sendMessageData);
  };

  // get servers that i am allowed to see
  (function () {
    for (const i in servers) {
      const server = servers[i];
      if (server.active === false) continue;
      let found = user.userData.admin;
      const { users } = server;
      if (users) {
        for (let j = 0; j < users.length; j++) {
          if (users[j] == user.userData.username) {
            found = true;
          }
        }
      }
      if (found) {
        myServers[i] = {
          id: server.id,
          name: server.name,
          game: server.game,
        };
      }
    }
  }());
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
  // widget actions
  if (messageData.action == 'widget') {
    let widgetEntry = null;
    let widget = null;
    if (user.userData !== null && currentServer) {
      switch (messageData.type) {
        case 'add':
          if (user.userData.restrictwidgets && user.userData.restrictwidgets.indexOf(messageData.widget) > -1) {
            deeperCallback({ note: { message: 'server.widget.restricted', type: 'danger' } });
            return;
          }
          var list = wdb.get('list');
          widget = Widget.get(messageData.widget);
          if (widget) {
            var widgetId = widget.id;
            if (list.find({ id: widget.id }).size().value()) {
              widgetId = null;
            } else {
              list.push({
                id: widgetId,
                position: list.size().value(),
                size: widget.manifest.compatibleSizes[0],
                options: {},
                storage: {},
              }).value();
              Widget.callMethodForAllWidgetsIfActive(
                'onWidgetAdded',
                currentServer,
              );
            }
          }
          deeperCallback({ widget: widgetId });
          break;
        case 'remove':
          if (user.userData.readonlyoptions || user.userData.restrictwidgets && user.userData.restrictwidgets.indexOf(messageData.widget) > -1) {
            deeperCallback({ note: { message: 'server.widget.restricted', type: 'danger' } });
            return;
          }
          widget = Widget.get(messageData.widget);
          if (widget) {
            wdb.get('list').remove({
              id: messageData.widget,
            }).value();
            delete widget.storageCache[currentServer.id];
            delete widget.optionsCache[currentServer.id];
          }
          deeperCallback({});
          break;
        case 'layout':
          widgetEntry = wdb.get('list').find({
            id: messageData.widget,
          });
          if (widgetEntry.size().value()) {
            for (const messageDataIndex in messageData.values) {
              if (messageData.values.hasOwnProperty(messageDataIndex)) {
                widgetEntry.set(messageDataIndex, messageData.values[messageDataIndex]).value();
              }
            }
          }
          deeperCallback({});
          break;
        case 'storage':
          widget = Widget.get(messageData.widget);
          if (widget) {
            widget.storage.set(currentServer, messageData.key, messageData.value, messageData.lifetime);
          }
          deeperCallback({});
          break;
        case 'option':
          if (user.userData.readonlyoptions) {
            deeperCallback({ note: { message: 'server.options.restricted', type: 'danger' } });
            return;
          }
          widget = Widget.get(messageData.widget);
          if (widget) {
            widget.options.set(currentServer, messageData.option, messageData.value);
          }
          deeperCallback({});
          break;
        default:
          deeperCallback({});
      }
      return;
    }
    deeperCallback({});
    return;
  }
  deeperCallback({});
};

module.exports = View;
