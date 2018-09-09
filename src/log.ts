import { app } from '.';

/**
 * This will log to Discord if connected and the console
 * @param level
 * @param message
 */
export const log = (level: string, message: string) => {
  const captains: any = console;
  if (app.discordHook) {
    app.discordHook.send(message);
  }
  captains[level](message);
};
