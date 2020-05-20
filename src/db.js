
const Low = require('lowdb');
const fs = require('fs');

const hash = require(`${__dirname}/hash`);

/**
 * LowDB helper
 */
const db = {};

/**
 * The db defaults
 * @type {object<string, *>}
 * @private
 */
db._defaults = {
  steamapi: {},
  servers: {},
  settings: {},
  users: {},
  widgets: { list: [] },
};

/**
 * Get lowdb instance
 * @param {string} file
 * @param {string=} folder
 * @returns {Low}
 */
db.get = function (file, folder) {
  let path = `${__dirname}/../db`;
  if (folder) path += `/${folder}`;
  path += `/${file}.json`;
  const inst = Low(path);
  // if getting settings than set some defaults
  if (typeof db._defaults[file] !== 'undefined') {
    if (file == 'settings') {
      db._defaults[file].salt = hash.random(64);
    }
    inst.defaults(db._defaults[file]).value();
  }
  return inst;
};

module.exports = db;
