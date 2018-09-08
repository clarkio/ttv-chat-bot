const express = require('express');
const bodyParser = require('body-parser');

const captains = console;
const app = express();
app.use(bodyParser.json());
const http = require('http').Server(app);
const io = require('socket.io')(http);
const config = require('./config');

const { port } = config;
const runningMessage = `Overlay server is running on port ${port}`;
const supportedOverlayColors = [
  'blue',
  'red',
  'green',
  'purple',
  'pink',
  'yellow',
  'orange',
  'teal',
  'black',
  'gray',
  'white'
];
let currentBulbColor = 'blue';

app.set('view engine', 'pug');
app.set('views', `${__dirname}/views`);

app.get('/scenes', (req, res) => {
  const { sceneName } = req.query;
  if (sceneName) {
    res.render(`index`, {
      iframeSrc: process.env[`${sceneName}`]
    });
  } else {
    res.status(400);
  }
});

app.post('/save', (req, res) => {
  const { colorName, hueRotateDeg } = req.body;
  captains.log(
    `Received overlay color, ${colorName} for a hue rotate of ${hueRotateDeg}`
  );
  res.send({ message: 'Saved' });
});

app.get('/overlay-colors', (req, res) => {
  res.render('overlay-colors');
});

app.get('/lights/:color', (req, res) => {
  io.emit('color-change', req.params.color);
  res.send('Done');
});

app.get('/lights/effects/:effect', (req, res) => {
  io.emit('color-effect', req.params.effect);
  res.send('Done');
});

app.get('/bulb/color', (req, res) => {
  res.json({ color: currentBulbColor });
});

app.use(express.static(__dirname));

function start() {
  // NOTE: it's using http to start the server and NOT app
  // This is so the socket.io host starts as well
  http.listen(port, () => {
    captains.log(runningMessage);
  });
}

function triggerSpecialEffect(message) {
  let effect;
  if (message.includes('cop mode')) {
    effect = 'cop mode';
  } else if (
    message.includes('subscribe') ||
    message.includes('cheer') ||
    message.includes('tip')
  ) {
    effect = 'subscribe';
  } else {
    effect = 'follow';
  }
  io.emit('color-effect', effect);
}

function updateOverlay(command) {
  supportedOverlayColors.forEach(color => {
    if (command.includes(color)) {
      currentBulbColor = color;
      io.emit('color-change', color);
    }
  });
}

module.exports = {
  start,
  triggerSpecialEffect,
  updateOverlay
};
