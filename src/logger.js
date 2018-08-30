const discordHook = require('./discord');

const captains = console;

module.exports = () =>
  function log(level, message) {
    discordHook.send(message);
    captains[level](message);
  };
