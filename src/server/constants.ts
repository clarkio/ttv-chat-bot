export const alertsListener = {
  authenticateMethod: 'jwt',
  connectionType: 'websocket',
  eventTypes: {
    follow: 'follow',
    raid: 'raid',
  },
  logs: {
    authenticated: 'Successfully authenticated for the channel',
    disconnected: 'Disconnected from Streamelements websocket',
  },
  unhandledAlertTypeLog: 'An alert was triggered that is not supported: ',
  websocketsConnectLog:
    'Successfully connected to the *Streamelements* websocket',
};

export const azureBot = {
  apiBaseUrl: 'https://directline.botframework.com/api/conversations/',
};

export const effectsManager = {
  audioFinishedEvent: 'audio-finished',
  failedSoundEffectMessage: 'failed to play the sorry sound effect',
  heccSoundEffect: 'hecc',
  playAudioEvent: 'play-audio',
  robertTablesHeccEmote: 'robert68hecc',
  sorrySoundEffect: 'sorry',
  stopAllAudioEvent: 'stop-all-audio',
  stopCurrentAudioEvent: 'stop-current-audio',
  unsupportedSoundEffectMessage:
    'the sound effect you entered is not supported. Please double check your spelling or use the !sfx command to see what is supported',
};

export const index = {
  logs: {
    configFileReadWarningMessage:
      'Unable to retrieve configuration from a file. Falling back to environment variables',
  },
};

export const obsHandler = {
  logs: {
    obsConnectionSuccessfulMessage:
      'Connected successfully to websockets server in OBS',
  },
  sceneCommand: 'scene',
};

export const overlay = {
  colorChangeEvent: 'color-change',
  colorEffectEvent: 'color-effect',
  copColorName: 'cop',
  defaultColor: 'deepskyblue', // [13:09] blendedsoftware: !bulb #54CAFF to match bulb and overlay
  defaultPort: 1337,
  minionSoundEffectFileName: 'beedoo.mp3',
  playAudioEvent: 'play-audio',
};

export enum StopCommands {
  Stop = 'stop',
  StopAll = 'stopall',
  Flush = 'flush',
}

export const soundEffects = {
  logs: {
    readFileError: 'There was an error attempting to read sound effects files',
  },
  playSoundConfig: {
    players: [
      'mplayer',
      'afplay', // afplay is default on macos
      'mpg123', // works on ubuntu with `sudo apt install mpg123`
      'mpg321',
      'play',
      'omxplayer',
      'cmdmp3',
    ],
  },
  soundsRelativeDirectory: '../../assets/sounds',
  stopCommands: [StopCommands.Stop, StopCommands.StopAll, StopCommands.Flush],
};

export const twitchChat = {
  defaultLightControlCommand: '!bulb',
  disableCommandMessage: 'disable',
  enableCommandMessage: 'enable',
  heccEmote: 'robert68hecc',
  logs: {
    ignoredCommandMessage:
      'Command was ignored because the TTV Chat Listener is disabled',
    nothingToParseMessage: 'there was nothing to do',
    twitchClientJoinedMessage: 'This client joined the channel...',
    twitchConnectionAttemptMessage:
      'Client is online and attempting to connect to chat...',
    twitchConnectionFailMessage: 'Failed to connect to Twitch chat',
    twitchConnectionSuccessMessage: 'Successfully connected to Twitch chat',
  },
  streamElementsUserName: 'streamelements',
  userDisplayNameKey: 'display-name',
};
