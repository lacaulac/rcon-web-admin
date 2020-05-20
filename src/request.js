
const http = require('http');
const https = require('https');
const url = require('url');

/**
 * Simple requests
 */
const request = {};

/**
 * Get contents for url
 * @param {string} u
 * @param {boolean} binary
 * @param {function} callback
 */
request.get = function (u, binary, callback) {
  const useHttp = u.match(/^https/) ? https : http;
  const options = url.parse(u);
  options.headers = {
    'Accept-language': 'en',
    'User-Agent': 'Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.102011-10-16 20:23:10',
    encoding: null,
  };
  const req = useHttp.get(options, (result) => {
    let body = binary ? [] : '';
    result.on('data', (chunk) => {
      if (binary) body.push(chunk);
      else body += chunk;
    });
    result.on('end', () => {
      try {
        callback(binary ? Buffer.concat(body) : body);
      } catch (e) {
        console.error('http request callback error', e);
      }
    });
  });
  req.on('error', (err) => {
    console.error('http request error', err);
    callback(null);
  });
};

module.exports = request;
