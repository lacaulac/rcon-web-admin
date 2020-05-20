
const Rcon = require('./rcon');
const Widget = require('./widget');
const db = require('./db');
const fs = require('fs');

/**
 * A single server instance
 * @param {string} id
 * @param {object} serverData
 * @constructor
 */
function RconServer(id, serverData) {
  /** @type {RconServer} */
  const self = this;
  /** @type {string} */
  this.id = id;
  /** @type {object} */
  this.serverData = serverData;
  /** @type {Rcon} */
  this.con = new Rcon(serverData.host, serverData.rcon_port, this);
  /** @type {boolean} */
  this.connected = false;
  /** @type {number|null} */
  this.widgetIv = null;
  /** @type {string} */
  this.serverDbFolder = `${__dirname}/../db/server_${self.id}`;

  // require this here to not get a loop because websocketuser itself require the RconServer module
  const WebSocketUser = require('./websocketuser');
  const serverName = `${serverData.host}:${serverData.rcon_port}`;

  /**
     * Temove this instance from server list
     * @param {boolean=} disconnect If true also do call disconnect
     */
  this.removeInstance = function (disconnect) {
    if (disconnect) {
      self.con.disconnect();
    } else {
      // send disconnect event to all clients
      for (let i = 0; i < WebSocketUser.instances.length; i++) {
        const user = WebSocketUser.instances[i];
        if (!user) continue;
        const server = user.getServerById(self.id);
        if (server && server.connected) {
          user.send('serverDisconnect', { serverid: self.id, servername: self.serverData.name });
        }
      }
      clearInterval(self.widgetIv);
      self.con = null;
      self.connected = false;
      delete RconServer.instances[self.id];
    }
  };

  /**
     * Send a command
     * @param {string} cmd
     * @param {WebSocketUser=} user
     * @param {boolean=} log If false than do not log this message to the server log file, otherwise log
     * @param {function=} callback
     */
  this.cmd = function (cmd, user, log, callback) {
    if (this.connected) {
      if (!user) user = null;
      if (log !== false) log = true;
      if (!callback) {
        callback = function () {

        };
      }
      this.con.send(cmd, user, log, (result) => {
        try {
          callback(result);
        } catch (e) {
          console.error(new Date(), `RconServer [${serverName}]: Command error`, e, e.stack);
        }
      });
      return;
    }
    callback(false);
  };

  /**
     * On receive a rcon socket message
     * @param {RconMessage} rconMessage
     */
  this.onServerMessage = function (rconMessage) {
    // if log is disabled or body is null than stop here
    if (rconMessage.log !== true || rconMessage.body.length == 0) return;
    const rconMessageJson = {
      type: rconMessage.type,
      body: rconMessage.body,
      user: rconMessage.user ? rconMessage.user.userData.username : null,
      server: rconMessage.server.id,
      timestamp: rconMessage.timestamp.toString(),
    };
    // push this message to all connected clients that have access to this server
    for (let i = 0; i < WebSocketUser.instances.length; i++) {
      const user = WebSocketUser.instances[i];
      if (!user) continue;
      const server = user.getServerById(self.id);
      if (server) {
        user.send('serverMessage', rconMessageJson);
      }
    }
    // also send to all active widgets
    Widget.callMethodForAllWidgetsIfActive('onServerMessage', this, rconMessage);
  };

  /**
     * Simulate the onServerMessage event by passing a simple string message
     * @param {string} message
     * @param {WebSocketUser=} user
     */
  this.injectServerMessage = function (message, user) {
    this.onServerMessage({
      id: -1,
      type: Rcon.SERVERDATA_RESPONSE_VALUE,
      size: message.length,
      log: true,
      timestamp: new Date(),
      user: user || null,
      server: this,
      body: message,
    });
  };

  // on disconnect remove server from instances
  this.con.on('disconnect', () => {
    self.removeInstance();
  });

  // connect to server
  this.con.connect((err) => {
    if (err) {
      console.error(new Date(), `RconServer [${serverName}]: Connection failed`);
      return;
    }
    if (self.serverData.web) {
      self.connected = true;
      Widget.callMethodForAllWidgetsIfActive('onServerConnected', self);
    } else {
      // authenticate
      self.injectServerMessage('Rcon authentication by rcon web admin...');
      self.con.send(self.serverData.rcon_password, null, true, (success) => {
        self.injectServerMessage(`Rcon authentication ${success ? 'successfull' : 'invalid'}`);
        if (!success) {
          console.error(new Date(), `Invalid rcon password for server ${self.serverData.name}:${self.serverData.rcon_port}`);
          return;
        }
        self.connected = true;
        Widget.callMethodForAllWidgetsIfActive('onServerConnected', self);
      }, Rcon.SERVERDATA_AUTH);
    }
    // catch errors
    self.con.on('error', (err) => {
      console.trace(`RconServer [${serverName}]`, err);
    });

    // on receive message
    self.con.on('message', (rconMessage) => {
      rconMessage.server = self;
      self.onServerMessage(rconMessage);
    });
  });

  // on disconnect remove server from instances
  this.con.on('disconnect', () => {
    self.removeInstance();
  });
}

/**
 * All opened server instances
 * @type {object<string, RconServer>}
 */
RconServer.instances = {};

/**
 * Connect to each servers in our pool
 */
RconServer.connectAll = function () {
  const servers = db.get('servers').value();
  if (servers) {
    for (const i in servers) {
      if (servers[i].active === false) continue;
      RconServer.get(servers[i].id, true);
    }
  }
};

/**
 * Get the server instance for given id
 * Connect to server if not yet connected
 * @param {string} id
 * @param {boolean=} connect If false or not set than return null if no connection exist
 * @return {RconServer|null}
 */
RconServer.get = function (id, connect) {
  if (RconServer.instances[id]) {
    return RconServer.instances[id];
  }
  if (!connect) return null;
  const serverData = db.get('servers').get(id).cloneDeep().value();
  if (serverData) {
    RconServer.instances[id] = new RconServer(id, serverData);
    return RconServer.instances[id];
  }
  return null;
};

// connect to all servers and create an interval
RconServer.connectAll();
// check each x seconds connect to each server in the list
// if already connected than nothing happen
setInterval(RconServer.connectAll, 10000);

module.exports = RconServer;
