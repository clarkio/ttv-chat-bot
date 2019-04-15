import * as config from './config';
import { appServer } from './index';

/**
 * This will log to Discord if connected and the console
 * @param level
 * @param message
 */
export const log = (level: string, message: string) => {
  const captains: any = console;
  if (config.discordHookEnabled) {
    // tslint:disable-next-line:ter-arrow-parens
    appServer.discordHook.send(message).catch(error => {
      captains.error(`Discord: ${error}`);
    });
  }
  captains[level](message);
};

export const dir = (message: string, obj: any) => {
  const captains: any = console;
  captains.dir(message, obj);
};
