export const alertsManager = {
  authenticateMethod: 'jwt',
  connectionType: 'websocket',
  eventTypes: {
    follow: 'follow',
    raid: 'raid'
  },
  logs: {
    authenticated: 'Successfully authenticated for the channel',
    disconnected: 'Disconnected from Streamelements websocket'
  },
  unhandledAlertTypeLog: 'An alert was triggered that is not supported: ',
  websocketsConnectLog:
    'Successfully connected to the *Streamelements* websocket'
};

export const azureBot = {
  apiBaseUrl: 'https://directline.botframework.com/api/conversations/'
};

export const effectsManager = {
  heccSoundEffect: 'hecc',
  failedSoundEffectMessage: 'failed to play the sorry sound effect',
  robertTablesHeccEmote: 'robert68hecc',
  sorrySoundEffect: 'sorry',
  unsupportedSoundEffectMessage:
    'the sound effect you entered is not supported. Please double check your spelling or use the !sfx command to see what is supported'
};

export const index = {
  logs: {
    configFileReadWarningMessage:
      'Unable to retrieve configuration from a file. Falling back to environment variables'
  }
};

export const obsManager = {
  logs: {
    obsConnectionSuccessfulMessage:
      'Connected successfully to websockets server in OBS'
  },
  sceneCommand: 'scene'
};
