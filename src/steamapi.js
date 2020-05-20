
const request = require('./request');
const db = require('./db');

/**
 * Steam utils
 */
const steamapi = {};

/**
 * Request to our api
 * @param {string} type
 * @param {string[]} ids
 * @param {function} callback
 */
steamapi.request = function (type, ids, callback) {
  if (!ids.length) {
    callback({});
    return;
  }
  const res = {};
  const missingIds = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const steamData = steamapi.getDataForId(type, id);
    if (steamData) {
      res[id] = steamData;
    } else {
      missingIds.push(id);
    }
  }
  if (missingIds.length) {
    request.get(`https://scripts.0x.at/steamapi/api.php?action=${type}&ids=${missingIds.join(',')}`, false, (result) => {
      if (result !== null) {
        let steamData = null;
        const data = JSON.parse(result);
        if (type == 'bans') {
          for (let i = 0; i < data.players.length; i++) {
            steamData = data.players[i];
            steamapi.saveDataForId(type, steamData.SteamId, steamData);
            res[steamData.SteamId] = steamData;
          }
        }
        if (type == 'summaries') {
          if (data.response) {
            for (const playerIndex in data.response.players) {
              if (data.response.players.hasOwnProperty(playerIndex)) {
                steamData = data.response.players[playerIndex];
                steamapi.saveDataForId(type, steamData.steamid, steamData);
                res[steamData.steamid] = steamData;
              }
            }
          }
        }
      }
      callback(res);
    });
  } else {
    callback(res);
  }
};

/**
 * Get db data for steamid
 * @param {string} type
 * @param {string} id
 * @returns {*}
 */
steamapi.getDataForId = function (type, id) {
  const sdb = db.get('steamapi');
  const playerData = sdb.get(id).value();
  if (!playerData || !playerData[type]) return null;
  if (playerData[type].timestamp < (new Date().getTime() / 1000 - 86400)) {
    delete playerData[type];
  }
  return playerData[type] || null;
};

/**
 * Save db data for steamid
 * @param {string} type
 * @param {string} id
 * @param {object} data
 * @returns {*}
 */
steamapi.saveDataForId = function (type, id, data) {
  const sdb = db.get('steamapi');
  let playerData = sdb.get(id).value();
  if (!playerData) playerData = {};
  data.timestamp = new Date().getTime() / 1000;
  playerData[type] = data;
  sdb.set(id, playerData).value();
};

/**
 * Delete old entries
 */
steamapi.cleanup = function () {
  try {
    const data = db.get('steamapi').value();
    const timeout = new Date() / 1000 - 86400;
    for (const steamId in data) {
      if (data.hasOwnProperty(steamId)) {
        const entries = data[steamId];
        for (const entryIndex in entries) {
          if (entries.hasOwnProperty(entryIndex)) {
            const entryRow = entries[entryIndex];
            if (entryRow.timestamp < timeout) {
              delete entries[entryIndex];
            }
          }
        }
      }
    }
    db.get('steamapi').setState(data);
  } catch (e) {
    console.error(new Date(), 'Steamapi cleanup failed', e, e.stack);
  }
};

// each 30 minutes cleanup the steamapi db and remove old entries
setInterval(steamapi.cleanup, 30 * 60 * 1000);
steamapi.cleanup();

module.exports = steamapi;
