
const db = require('./db');
const hash = require('./hash');
const Widget = require('./widget');

/**
 * A single websocket user
 * @constructor
 */
function WebSocketUser(socket) {
  /** @type {WebSocketUser} */
  const self = this;
  /** @type {number|null} */
  this.id = null;
  /** @type {WebSocket} */
  this.socket = socket;
  /**
     * The current stored userdata
     * Updated with each websocket incoming message
     * @type {null}
     */
  this.userData = null;
  /**
     * The current active server
     * Updated with each incoming websocket request
     * This means this is only possibly set if user is viewing the dashboard
     * @type {RconServer|null}
     */
  this.server = null;

  // require this here to not get a loop because rconserver itself require the websocketuser module
  const RconServer = require('./rconserver');

  /**
     * Send message to client
     * @param {string} action
     * @param {object=} messageData
     * @param {number=} callbackId
     */
  this.send = function (action, messageData, callbackId) {
    if (self.socket) {
      if (typeof messageData === 'undefined') {
        messageData = null;
      }
      const data = {
        action,
        messageData,
      };
      if (typeof callbackId === 'number') {
        data.callbackId = callbackId;
      }
      self.socket.send(JSON.stringify(data));
    }
  };

  /**
     * On receive message from socket
     * @param {object} frontendData
     */
  this.onMessage = function (frontendData) {
    // this will be called when message verification is done
    const verificationDone = function () {
      // just send a message to the user for the callback in the frontend
      const sendCallback = function (sendMessageData) {
        if (!sendMessageData) sendMessageData = {};
        if (!sendMessageData.sessionUserData && self.userData !== null) {
          sendMessageData.sessionUserData = self.userData;
          delete sendMessageData.sessionUserData.password;
        }
        self.send(frontendData.action, sendMessageData, frontendData.callbackId);
      };
      try {
        const { messageData } = frontendData;
        self.server = messageData && messageData.server ? self.getServerById(messageData.server) : null;
        switch (frontendData.action) {
          case 'widget':
            if (self.server && self.server.connected) {
              Widget.callMethodForAllWidgetsIfActive(
                'onFrontendMessage',
                self.server,
                self,
                messageData.widgetAction,
                messageData.widgetMessageData,
                (widget, widgetMessageData) => {
                  if (widget instanceof Widget !== true) {
                    console.trace('Widget.onFrontendMessage callback need a widget instance as first parameter');
                    return;
                  }
                  if (widget.id === messageData.widget) {
                    sendCallback({ widgetMessageData });
                  }
                },
              );
            }
            break;
          case 'view':
            if (!db.get('users').size().value()) {
              // if no user exist, force user admin panel
              messageData.view = 'users';
            } else if (self.userData === null) {
              // if not logged in, force login page
              messageData.view = 'login';
            }
            var View = require('./views/${messageData.view}');
            View(self, messageData, (viewData) => {
              if (!viewData) viewData = {};
              viewData.view = messageData.view;
              if (viewData.redirect) {
                viewData.view = viewData.redirect;
              }
              if (messageData.form) {
                viewData.form = messageData.form;
              }
              if (messageData.btn) {
                viewData.btn = messageData.btn;
              }
              sendCallback(viewData);
            });
            break;
          case 'cmd':
            if (self.server && self.server.connected) {
              if (self.userData.restrictcommands) {
                const commands = self.userData.restrictcommands.split(',');
                let found = false;
                for (let i = 0; i < commands.length; i++) {
                  const command = commands[i].trim();
                  if (command && messageData.cmd.match(new RegExp(command, 'ig'))) {
                    found = true;
                    break;
                  }
                }
                if (found) {
                  sendCallback({ note: { message: 'server.cmd.restricted', type: 'danger' } });
                  return;
                }
              }
              self.server.injectServerMessage(`> ${messageData.cmd}`, self);
              self.server.cmd(messageData.cmd, self, true, (serverMessage) => {
                sendCallback({ message: serverMessage });
              });
              return;
            }
            sendCallback({ error: { message: 'Not connected to RCON server' } });
            break;
          case 'closed':
            WebSocketUser.instances.splice(self.id, 1);
            self.socket = null;
            self.userData = null;
            break;
          case 'init':
            sendCallback({
              package: require('../package'),
              latestVersion: require('./core').latestVersion,
            });
            break;
          default:
            sendCallback();
            break;
        }
      } catch (e) {
        sendCallback({
          error: {
            message: e.message,
            stack: self.userData && self.userData.admin ? e.stack : null,
          },
        });
      }
    };

    // everytime a request comes in, validate the user
    // after that go ahead with message processing
    const users = db.get('users').get().cloneDeep().value();
    // invalidate userdata and check against stored users
    self.userData = null;
    if (frontendData.loginHash && frontendData.loginName) {
      const userData = db.get('users').find({
        username: frontendData.loginName,
        loginHash: frontendData.loginHash,
      }).cloneDeep().value();
      if (userData) {
        self.userData = userData;
        // add instance of this is a complete new user
        if (self.id === null) {
          self.id = WebSocketUser.instances.length;
          WebSocketUser.instances.push(self);
        }
        verificationDone();
        return;
      }
    }
    verificationDone();
  };

  /**
     * Get a server instance by id, only if this user is in the list of assigned users
     * Admins can get all server instances
     * @param {string} id
     * @return {RconServer|null}
     */
  this.getServerById = function (id) {
    if (!id) {
      return null;
    }
    if (self.userData === null) {
      return null;
    }
    const server = RconServer.get(id);
    if (!server) {
      return null;
    }
    if (self.userData && self.userData.admin) {
      return server;
    }
    const { users } = server.serverData;
    if (users) {
      for (let j = 0; j < users.length; j++) {
        const user = users[j];
        if (user == self.userData.username) {
          return server;
        }
      }
    }
    return null;
  };

  /**
     * Convert to json
     * @returns {object}
     */
  this.toJSON = function () {
    return { username: this.userData.username };
  };
}

/**
 * All user instances
 * @type []
 */
WebSocketUser.instances = [];

module.exports = WebSocketUser;
