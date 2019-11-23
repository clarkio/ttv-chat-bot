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
