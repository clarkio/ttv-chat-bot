import { app } from '.';
import { discordHookEnabled } from './config';

/**
 * This will log to Discord if connected and the console
 * @param level
 * @param message
 */
export const log = (level: string, message: string) => {
  const captains: any = console;
  if (discordHookEnabled === 'true' || discordHookEnabled === true) {
    app.discordHook.send(message).catch(captains.error);
  }
  captains[level](message);
};
