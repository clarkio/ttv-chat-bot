type captainLevels = 'log' | 'info' | 'error' | 'warn';

type Captain = {
  [level in captainLevels]: (...message: any[]) => void;
};

type hookFn = (message: string) => void;

let hook: hookFn;
const captains: Captain = console;

/**
 * This will log to Discord if connected and the console
 * @param level
 * @param message
 */
export const log = (level: captainLevels, message: string) => {
  if (hook) {
    hook(message);
  }

  captains[level](message);
};

export const dir = (value?: any, ...optionalParams: any[]) => {
  // tslint:disable-next-line: no-console
  console.dir(value, ...optionalParams);
};

export function setHook(fn: hookFn) {
  hook = fn;
}
