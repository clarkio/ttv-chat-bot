import express from 'express';
import { appServer } from '../index';

export const changeLightColor = (
  req: express.Request,
  res: express.Response
) => {
  appServer.io.emit('color-change', req.params.color);
  res.send('Done');
};

export const sendLightEffect = (
  req: express.Request,
  res: express.Response
) => {
  appServer.io.emit('color-effect', req.params.effect);
  res.send('Done');
};
