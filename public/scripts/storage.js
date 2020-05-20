
/**
 * Storage handling
 */
const Storage = {};

/**
 * Get data from storage, from sessionstorage or localstorage, try both
 * @param {string} key
 * @returns {*}
 */
Storage.get = function (key) {
  let storage = sessionStorage;
  let value = storage.getItem(key);
  if (value === null) {
    storage = localStorage;
    value = storage.getItem(key);
    if (value === null) return null;
  }
  return JSON.parse(value);
};

/**
 * Set data in storage
 * @param {string} key
 * @param {*} value
 * @param {boolean=} session
 */
Storage.set = function (key, value, session) {
  const storage = session ? sessionStorage : localStorage;
  if (value === null || typeof value === 'undefined') {
    storage.removeItem(key);
  } else {
    storage.setItem(key, JSON.stringify(value));
  }
};
