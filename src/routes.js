
/**
 * Express routes, url handling
 */

const express = require('express');
const path = require('path');

const app = express();
const config = require('./config');

app.get('/', (req, res) => {
  res.sendFile(path.resolve(`${__dirname}/../public/index.html`));
});

// output the required ws port number
app.get('/wsconfig', (req, res) => {
  res.send(JSON.stringify({ port: config.port + 1, sslUrl: config.websocketUrlSsl, url: config.websocketUrl }));
});

app.use(express.static(`${__dirname}/../public`));

app.listen(config.port, config.host, () => {

});
