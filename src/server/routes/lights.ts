import express from 'express';
import { AppServer } from '../server';

export function lightsRouter(appServer: AppServer) {
  const changeLightColor = (req: express.Request, res: express.Response) => {
    appServer.io.emit('color-change', req.params.color);
    res.send('Done');
  };

  const sendLightEffect = (req: express.Request, res: express.Response) => {
    appServer.io.emit('color-effect', req.params.effect);
    res.send('Done');
  };

  return {
    changeLightColor,
    sendLightEffect
  };
}
