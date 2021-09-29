import express from 'express';
import * as config from '../config';

// TODO: limit to only certain environment variables
export const tokensRoute = (req: express.Request, res: express.Response) => {
  const { name } = req.query;
  if (name && config.tokens[name]) {
    res.send(config.tokens[name]);
  } else {
    res.statusCode = 400;
    res.send('Not a valid token');
  }
};

// phrakberg was here too
