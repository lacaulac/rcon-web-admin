
const fs = require('fs');

const db = require('./db');
const request = require('./request');
const fstools = require('./fstools');

/**
 * A widget
 * @param {string} id
 * @constructor
 */
function Widget(id) {
  /** @type {Widget} */
  const self = this;
  /**
     * The widget internal name
     * @type {string}
     */
  this.id = id;
  /**
     * The widget manifest data
     * @type {{}}
     */
  this.manifest = {};
  /**
     * The widgets options cached
     * @type {{}}
     */
  this.optionsCache = {};
  /**
     * The widgets storage cached
     * @type {{}}
     */
  this.storageCache = {};

  /**
     * On lowdb instance for this widget for a given server
     * @param {RconServer} server
     * @returns {LoDashWrapper}
     */
  this.getDbEntry = function (server) {
    const wdb = db.get('widgets', `server_${server.id}`).get('list');
    const found = wdb.find({
      id: this.id,
    });
    if (found.size().value()) {
      return found;
    }
    return null;
  };

  /**
     * Send a message to all connected frontend widgets
     * @param {RconServer} server
     * @param {*} message
     */
  this.sendMessageToFrontend = function (server, message) {
    const WebSocketUser = require('./websocketuser');
    for (let i = 0; i < WebSocketUser.instances.length; i++) {
      const user = WebSocketUser.instances[i];
      if (!user || !user.server) continue;
      user.send('widgetBackendMessage', { server: user.server.id, widget: self.id, message });
    }
  };

  /**
     * The widget storage
     * @type {{}}
     */
  this.storage = {};

  /**
     * Get the storage object for given server
     * @param {RconServer} server
     * @return {object|null}
     */
  this.storage.getObject = function (server) {
    const RconServer = require('./rconserver');
    if (server instanceof RconServer === false) {
      console.trace('Widget.storage methods require a RconServer instance as first parameter');
      return null;
    }
    if (typeof self.storageCache[server.id] === 'undefined') {
      self.storageCache[server.id] = {};
      const entry = self.getDbEntry(server);
      if (entry) {
        self.storageCache[server.id] = entry.get('storage').cloneDeep().value() || {};
      }
    }
    return self.storageCache[server.id];
  };

  /**
     * Set a value in the widget storage
     * @param {RconServer} server
     * @param {string} key
     * @param {*} value
     * @param {number=} lifetime Lifetime of the stored data in seconds, ommit if not timeout
     */
  this.storage.set = function (server, key, value, lifetime) {
    const data = this.getObject(server);
    if (!data) return null;
    data[key] = value;
    data[`${key}.lifetime`] = lifetime && lifetime > -1 ? (new Date().getTime() / 1000) + lifetime : -1;
    const entry = self.getDbEntry(server);
    if (entry) {
      entry.set('storage', data).value();
    }
  };

  /**
     * Get a value from the widget storage
     * @param {RconServer} server
     * @param {string} key
     * @returns {*|null} Null if not found
     */
  this.storage.get = function (server, key) {
    const data = this.getObject(server);
    if (!data || typeof data[key] === 'undefined' || data[key] === null) return null;
    const lifetime = data[`${key}.lifetime`];
    if (lifetime > -1) {
      // if lifetime has ended than return null
      if (lifetime < new Date().getTime() / 1000) return null;
    }
    return data[key];
  };

  /**
     * The widget options
     * @type {{}}
     */
  this.options = {};

  /**
     * Get the options object for given server
     * @param {RconServer} server
     * @return {object|null}
     */
  this.options.getObject = function (server) {
    const RconServer = require(`${__dirname}/rconserver`);
    if (server instanceof RconServer === false) {
      console.trace('Widget.options methods require a RconServer instance as first parameter');
      return null;
    }
    if (typeof self.optionsCache[server.id] === 'undefined') {
      self.optionsCache[server.id] = null;
      const entry = self.getDbEntry(server);
      if (entry) {
        self.optionsCache[server.id] = entry.get('options').cloneDeep().value();
      }
    }
    return self.optionsCache[server.id];
  };

  /**
     * Set an option value
     * @param {RconServer} server
     * @param {string} key
     * @param {*} value
     */
  this.options.set = function (server, key, value) {
    const data = this.getObject(server);
    if (!data) return null;
    const option = self.manifest.options[key];
    if (option) {
      if (option.type == 'switch') value = value === '1' || value === true;
      if (option.type == 'number') value = parseFloat(value);
      data[key] = value;
      const entry = self.getDbEntry(server);
      if (entry) {
        entry.set('options', data).value();
      }
    }
  };

  /**
     * Get value of an option
     * @param {RconServer} server
     * @param {string} key
     * @returns {*} Return the manifest default value if no saved value has been found
     */
  this.options.get = function (server, key) {
    const data = this.getObject(server);
    let value = data && data[key] !== null && typeof data[key] !== 'undefined' ? data[key] : null;
    if (value === null) {
      const option = self.manifest.options[key];
      if (option) {
        value = option.default;
      }
    }
    return value;
  };

  /**
     * On rcon server has successfully connected and authenticated
     * @param {RconServer} server
     */
  this.onServerConnected = function (server) {
    // override this function in the child widget
  };

  /**
     * On widget update cycle - Fired every 30 seconds for each server
     * @param {RconServer} server
     */
  this.onUpdate = function (server) {
    // override this function in the child widget
  };

  /**
     * On frontend message
     * @param {RconServer} server
     * @param {WebSocketUser} user
     * @param {string} action The action
     * @param {*} messageData Any message data received from frontend
     * @param {function} callback Pass an object as message data response for the frontend
     */
  this.onFrontendMessage = function (server, user, action, messageData, callback) {
    // override this function in the child widget
  };

  /**
     * On receive a server message
     * @param {RconServer} server
     * @param {RconMessage} message
     */
  this.onServerMessage = function (server, message) {
    // override this function in the child widget
  };

  /**
     * Fired when widget is added to a server dashboard
     * @param {RconServer} server
     */
  this.onWidgetAdded = function (server) {
    // override this function in the child widget
  };
}

/**
 * All widgets
 * @type {{string: Widget}}
 */
Widget.widgets = {};

/**
 * All existing widget ids
 * @type {Array|null}
 */
Widget.widgetIds = null;

/**
 * Install a widget from a git repository
 * If already exist try to update
 * @param {string} repository
 * @param {function=} callback
 */
Widget.install = function (repository, callback) {
  const unzip = require('unzipper');
  let dir = fs.realpathSync('../public/widgets');
  dir = dir.replace(/\\/g, '/');
  if (repository.match(/^https/)) {
    repository = repository.match(/https:\/\/github\.com\/([^\/]+\/[^\/\?\#]+)/)[1];
  }
  const id = repository.split('/')[1];
  const repoDir = `${dir}/${id}`;
  if (fs.existsSync(repoDir)) {
    // delete existing folder
    fstools.deleteRecursive(repoDir);
  }
  fs.mkdir(repoDir, 0o777, (err) => {
    if (err) {
      console.error('Cannot create widget directory', err);
      callback(false);
      return;
    }
    request.get(`https://codeload.github.com/${repository}/zip/master`, true, (contents) => {
      if (!contents.length) {
        console.error('Cannot load widget repository zip file');
        callback(false);
        return;
      }
      fs.writeFile(`${repoDir}/master.zip`, contents, { mode: 0o777 }, () => {
        fs.createReadStream(`${repoDir}/master.zip`).pipe(unzip.Parse()).on('entry', (entry) => {
          const fileName = entry.path.split('/').slice(1).join('/');
          if (!fileName.length) return;
          const path = `${repoDir}/${fileName}`;
          if (entry.type == 'Directory') {
            fs.mkdirSync(path, 0o777);
            entry.autodrain();
          } else {
            entry.pipe(fs.createWriteStream(path));
          }
        }).on('close', () => {
          fs.unlinkSync(`${repoDir}/master.zip`);
          callback(true);
        });
      });
    });
  });
};

/**
 * Fully delete a widget from the disk
 * @param {string} id
 * @param {function=} callback
 */
Widget.delete = function (id, callback) {
  const widget = Widget.get(id);
  if (widget) {
    fstools.deleteRecursive(`${__dirname}/../public/widgets/${id}`);
    // delete all entries with this widget in the server widgets
    const RconServer = require(`${__dirname}/rconserver`);
    for (const serverIndex in RconServer.instances) {
      if (RconServer.instances.hasOwnProperty(serverIndex)) {
        const server = RconServer.instances[serverIndex];
        const list = db.get('widgets', `server_${server.id}`).get('list').values();
        if (list) {
          const newList = [];
          for (let i = 0; i < list.length; i++) {
            const widgetEntry = list[i];
            if (widgetEntry.id !== id) newList.push(widgetEntry);
          }
          db.get('widgets', `server_${server.id}`).set('list', newList).value();
        }
      }
    }
  }
  callback();
};

/**
 * Get a list of all widget ids
 * @return {string[]}
 */
Widget.getAllWidgetIds = function () {
  if (Widget.widgetIds === null) {
    Widget.widgetIds = [];
    const dir = `${__dirname}/../public/widgets`;
    const files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.match(/^(\.|README.md)/i)) continue;
      Widget.widgetIds.push(file);
    }
  }
  return Widget.widgetIds;
};

/**
 * Get a list of all widget instances - Try to load all not loaded instances
 * @return {{string: Widget}}
 */
Widget.getAllWidgets = function () {
  const ids = Widget.getAllWidgetIds();
  const widgets = {};
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const widget = Widget.get(id);
    if (widget) {
      widgets[id] = widget;
    }
  }
  return widgets;
};

/**
 * Call a specific method for all widgets if the widget is active/enabled in the server's widget list
 * Pass all remaining arguments directly to the call
 * @param {string} method
 * @param {RconServer} server
 */
Widget.callMethodForAllWidgetsIfActive = function (method, server) {
  try {
    const widgets = Widget.getAllWidgets();
    for (const widgetsIndex in widgets) {
      if (widgets.hasOwnProperty(widgetsIndex)) {
        const widgetsRow = widgets[widgetsIndex];
        const entry = widgetsRow.getDbEntry(server);
        if (entry) {
          widgetsRow[method].apply(widgetsRow, Array.prototype.slice.call(arguments, 1));
        }
      }
    }
  } catch (e) {
    console.error(new Date(), e.stack);
  }
};

/**
 * Get a single widget by id
 * @param {string} id
 * @return {Widget|null}
 */
Widget.get = function (id) {
  if (typeof Widget.widgets[id] === 'undefined') {
    Widget.widgets[id] = null;
    const dir = `${__dirname}/../public/widgets/${id}`;
    if (fs.existsSync(`${dir}/backend.js`)) {
      // invalidate require cache also before fetching
      // because it's possible that the widget code has been reloaded
      delete require.cache[`${dir}/backend`];
      const widget = require(`${dir}/backend`);
      if (widget) {
        widget.id = id;
        widget.manifest = require(`${dir}/manifest.json`);
        Widget.widgets[id] = widget;
      }
    }
  }
  return Widget.widgets[id];
};

/**
 * Call onUpdate methods for all active widgets for all connected servers
 */
Widget.updateAllActive = function () {
  try {
    const RconServer = require(`./rconserver`);
    const WebSocketUser = require(`./websocketuser`);
    for (const serverIndex in RconServer.instances) {
      if (RconServer.instances.hasOwnProperty(serverIndex)) {
        const server = RconServer.instances[serverIndex];
        Widget.callMethodForAllWidgetsIfActive('onUpdate', server);
      }
    }
    // send a ping to the frontend for all user's that have a server currently opened on the dashboard
    for (let i = 0; i < WebSocketUser.instances.length; i++) {
      const user = WebSocketUser.instances[i];
      if (!user || !user.server) continue;
      user.send('widgetUpdateDone', { server: user.server.id });
    }
  } catch (e) {
    console.error(new Date(), 'Widget update all active error', e);
  }
};


/**
 * Fetch latest versions for all installed widgets
 * Stored it into widget.manifest._latestVersion
 */
Widget.fetchLatestVersions = function () {
  const widgets = Widget.getAllWidgetIds();
  for (let i = 0; i < widgets.length; i++) {
    (function (widget) {
      if (widget) {
        request.get(`https://raw.githubusercontent.com/${widget.manifest.repository}/master/manifest.json`, false, (content) => {
          if (content) {
            const manifest = JSON.parse(content);
            if (manifest && manifest.version) {
              widget.manifest._latestVersion = manifest.version;
            }
          }
        });
      }
    }(Widget.get(widgets[i])));
  }
};

// each 30 seconds call the updates for each active widget
setInterval(Widget.updateAllActive, 30000);
// and call 5 second after server startup
setTimeout(Widget.updateAllActive, 5000);

// fetch latest version each hour
setInterval(Widget.updateAllActive, 1000 * 60 * 60);
// and call 5 second after server startup
setTimeout(Widget.fetchLatestVersions, 5000);


module.exports = Widget;
