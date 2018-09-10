import express from 'express';
import { app } from '../index';

export const changeLightColor = (
  req: express.Request,
  res: express.Response
) => {
  app.io.emit('color-change', req.params.color);
  res.send('Done');
};

export const sendLightEffect = (
  req: express.Request,
  res: express.Response
) => {
  app.io.emit('color-effect', req.params.effect);
  res.send('Done');
};
