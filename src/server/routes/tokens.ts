import express from 'express';
import * as config from '../config';

export const tokensRoute = (req: express.Request, res: express.Response) => {
  const { name } = req.query;
  if (name && isSupported(name) && config.tokens[name]) {
    res.send(config.tokens[name]);
  } else {
    res.statusCode = 400;
    res.send('Not a valid token');
  }
};

function isSupported(name: string): boolean {
  // Only support the one environment variable
  return name === 'azureSpeechToken';
}

// phrakberg was here too
