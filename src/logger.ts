const discordHook = require('./discord');

export const log = (level: string, message: string) => {
  const captains: any = console;
  discordHook.send(message);
  captains[level](message);
};
