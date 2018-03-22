let discordHook;

module.exports = function(discordHook) {
  this.discordHook = discordHook;
  return function log(level, message) {
    discordHook.send(message);
    console[level](message);
  };
};
