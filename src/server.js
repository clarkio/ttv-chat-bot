const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
require('dotenv').config();

const port = process.env.PORT || 1338;
const runningMessage = 'Overlay server is running on port ' + port;
const cannedColors = [
  'blue',
  'red',
  'green',
  'purple',
  'pink',
  'yellow',
  'orange',
  'teal',
  'black',
  'gray'
];
let currentBulbColor = 'blue';

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/main/greenscreen', (req, res) => {
  res.sendFile(__dirname + '/gs.html');
});

app.get('/main/guest', (req, res) => {
  res.sendFile(__dirname + '/guest.html');
});

app.get('/main/guest2', (req, res) => {
  res.sendFile(__dirname + '/guest2.html');
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

app.get('/main/greenscreen/overlay', (req, res) => {
  res.json({ overlayIframe: process.env.greenscreenOverlayIframe });
});

app.get('/main/overlay', (req, res) => {
  res.json({ overlayIframe: process.env.mainOverlayIframe });
});

app.get('/main/guest/overlay', (req, res) => {
  res.json({ overlayIframe: process.env.guestOverlayIframe });
});

app.get('/main/guest2/overlay', (req, res) => {
  res.json({ overlayIframe: process.env.guest2OverlayIframe });
});

app.use(express.static(__dirname));

function start() {
  // NOTE: it's using http to start the server and NOT app
  // This is so the socket.io host starts as well
  http.listen(port, () => {
    console.log(runningMessage);
  });
}

function triggerSpecialEffect(message) {
  let effect;
  if (message.includes('cop mode')) {
    effect = 'cop mode';
  } else if (message.includes('subscribe')) {
    effect = 'subscribe';
  } else if (message.includes('follow')) {
    effect = 'follow';
  }
  io.emit('color-effect', effect);
}

function updateOverlay(command) {
  cannedColors.forEach(color => {
    if (command.includes(color)) {
      currentBulbColor = color;
      io.emit('color-change', color);
    }
  });
}

module.exports = {
  start: start,
  triggerSpecialEffect: triggerSpecialEffect,
  updateOverlay: updateOverlay
};
