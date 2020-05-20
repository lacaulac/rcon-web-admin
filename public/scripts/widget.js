
/**
 * Widget Management
 */
function Widget(id) {
  /** @type {Widget} */
  const self = this;
  /** @type {string} */
  this.id = id;
  /** @type {string} */
  this.server = '';
  /** @type {object} */
  this.serverData = '';
  /** @type {string} */
  this.id = id;
  /** @type {string[]} */
  this.socketMessageHandlers = [];
  /** @type {JQuery} */
  this.container = null;
  /** @type {JQuery} */
  this.content = null;
  /** @type {object} */
  this.data = null;
  /** @type {JQuery|null} */
  this.templateEl = null;

  /**
     * On widget init
     */
  this.onInit = function () {
    // override this function in the child widget
  };

  /**
     * Fired when the backend send a message to all connected frontend users
     * @param {object} messageData
     */
  this.onBackendMessage = function (messageData) {
    // override this function in the child widget
  };

  /**
     * Fired after the backend widget have done it's onUpdate cycle
     */
  this.onBackendUpdate = function () {
    // override this function in the child widget
  };

  /**
     * On widget option update
     * @param {string} key
     * @param {*} value
     */
  this.onOptionUpdate = function (key, value) {
    // override this function in the child widget
  };

  /**
     * Bind a callback when the rcon server send a message
     * @param {string} id
     * @param {function} callback
     */
  this.onRconMessage = function (id, callback) {
    const socketCallback = function (data) {
      if (data.action == 'serverMessage' && self.server == data.messageData.server) {
        callback(data.messageData);
      }
    };
    const msgId = `widget.onRconMessage.${self.id}.${id}`;
    Socket.onMessage(msgId, socketCallback);
    this.socketMessageHandlers.push(msgId);
  };

  /**
     * Load the html template file and return the jquery object for it
     * @param {string=} selector Optional selector to select a given element
     * @returns {JQuery}
     */
  this.template = function (selector) {
    let el = null;
    if (selector) el = this.templateEl.find(selector).clone();
    else el = this.templateEl.clone();
    lang.replaceInHtml(el, self);
    return el;
  };

  /**
     * Send a raw command to the server
     * @param {string} action
     * @param {object=} messageData
     * @param {function=} callback
     */
  this.send = function (action, messageData, callback) {
    if (!messageData) messageData = {};
    messageData.server = self.server;
    Socket.send(action, messageData, (data) => {
      if (callback) callback(data);
    });
  };

  /**
     * Send a rcon command directly to the server
     * @param {string} cmd
     * @param {function=} callback
     */
  this.cmd = function (cmd, callback) {
    this.send('cmd', { cmd }, (data) => {
      if (callback) callback(data.message);
    });
  };

  /**
     * Send a message to the backend script
     * @param {string} action
     * @param {*} messageData
     * @param {function=} callback
     */
  this.backend = function (action, messageData, callback) {
    this.send('widget', {
      widgetAction: action,
      widgetMessageData: messageData,
      widget: self.id,
    }, (responseData) => {
      if (callback) callback(responseData.widgetMessageData);
    });
  };

  /**
     * Get a locale translation value from widgets manifest
     * @param {string} key
     * @param {object=} params
     * @return {string}
     */
  this.t = function (key, params) {
    let v = key;
    const { locale } = self.data.manifest;
    if (!locale) {
      return key;
    }
    if (typeof locale[lang.language] !== 'undefined' && typeof locale[lang.language][key] !== 'undefined') {
      v = locale[lang.language][key];
    } else if (typeof locale.en !== 'undefined' && typeof locale.en[key] !== 'undefined') {
      v = locale.en[key];
    }
    if (typeof params !== 'undefined') {
      for (const i in params) {
        if (params.hasOwnProperty(i)) {
          v = v.replace(new RegExp(`{${i}}`, 'ig'), params[i]);
        }
      }
    }
    return v;
  };

  /**
     * The widget storage
     * @type {object}
     */
  this.storage = {};

  /**
     * Set a value in the widget storage
     * @param {string} key
     * @param {*} value
     * @param {number=} lifetime Lifetime of the stored data in seconds, ommit if not timeout
     * @param {function=} callback
     */
  this.storage.set = function (key, value, lifetime, callback) {
    lifetime = lifetime ? (new Date().getTime() / 1000) + lifetime : -1;
    self.data.storage[key] = value;
    self.data.storage[`${key}.lifetime`] = lifetime;
    self.send('view', {
      view: 'index',
      action: 'widget',
      widget: self.id,
      type: 'storage',
      lifetime,
      key,
      value,
    }, callback);
  };

  /**
     * Get a value from the widget storage
     * @param {string} key
     * @returns {*|null} Null if not found
     */
  this.storage.get = function (key) {
    const data = self.data.storage[key];
    if (typeof data === 'undefined') return null;
    const lifetime = self.data.storage[`${key}.lifetime`];
    if (lifetime > -1) {
      // if lifetime has ended than return null
      if (lifetime < new Date().getTime() / 1000) return null;
    }
    return data;
  };

  /**
     * The widget options
     * @type {object}
     */
  this.options = {};

  /**
     * Set an option value
     * @param {string} key
     * @param {*} value
     * @param {function=} callback
     */
  this.options.set = function (key, value, callback) {
    const option = self.data.manifest.options[key];
    if (option) {
      self.send('view', {
        view: 'index',
        action: 'widget',
        widget: self.id,
        type: 'option',
        option: key,
        value,
      }, () => {
        if (callback) callback();
        self.data.options[key] = value;
        self.onOptionUpdate(key, value);
      });
    }
  };

  /**
     * Get value of a defined manifest option
     * @param {string} key
     * @returns {*|null} Null if not found
     */
  this.options.get = function (key) {
    if (self.data.options && typeof self.data.options[key] !== 'undefined') {
      return self.data.options[key];
    }
    if (self.data.manifest.options && typeof self.data.manifest.options[key] !== 'undefined') {
      return self.data.manifest.options[key].default;
    }
    return null;
  };

  /**
     * Create an interval, automatically destroy previous interval if exist
     * @param {string} id
     * @param {function} func
     * @param {number} step
     */
  this.createInterval = function (id, func, step) {
    Interval.create(`widget.${self.id}.${id}`, func, step);
  };

  /**
     * Destroy an interval
     * @param {string} id
     */
  this.destroyInterval = function (id) {
    Interval.destroy(`widget.${self.id}.${id}`);
  };

  /**
     * Delete the widget and drop all data and handlers
     */
  this.remove = function () {
    for (const i in this.socketMessageHandlers) {
      Socket.offMessage(this.socketMessageHandlers[i]);
    }
    delete Widget.widgets[this.id];
    this.container.remove();
  };

  /**
     * Bind the socket listener
     */
  this.bindSocketListener = function () {
    const socketCallback = function (data) {
      if (data.action == 'widgetUpdateDone' && self.server == data.messageData.server) {
        self.onBackendUpdate();
      }
      if (data.action == 'widgetBackendMessage' && self.server == data.messageData.server && self.id == data.messageData.widget) {
        self.onBackendMessage(data.messageData.message);
      }
    };
    Socket.onMessage(`widget.listener.${self.id}`, socketCallback);
    self.socketMessageHandlers.push('widget.widgetUpdateDone');
  };
}

/**
 * The register callback
 * @type {object<string, WidgetRegisterCallback>}
 */
Widget.registerCallback = {};

/**
 * All widgets
 * @type {{string: Widget}}
 */
Widget.widgets = {};

/**
 * Get widget by given html element
 * @param {string|JQuery} el
 * @return {Widget|null}
 */
Widget.getByElement = function (el) {
  const w = $(el).closest('.widget');
  if (w.length) {
    if (typeof Widget.widgets[w.attr('data-id')] !== 'undefined') {
      return Widget.widgets[w.attr('data-id')];
    }
  }
  return null;
};

/**
 * Register a callback
 * @param {string} id
 * @param {WidgetRegisterCallback} callback
 */
Widget.register = function (id, callback) {
  Widget.registerCallback[id] = callback;
};

/**
 * The timeout for a option change
 * @type {number}
 */
Widget._optionChangeTimeout = null;

/**
 * Widget Register Callback
 * @callback WidgetRegisterCallback
 * @param {Widget} widget
 */
