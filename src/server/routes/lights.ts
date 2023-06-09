import express from 'express';

export function lightsRouter() {
  const changeLightColor = (req: express.Request, res: express.Response) => {
    //@ts-ignore
    req.socketServer!.emit('color-change', req.params.color);
    res.send('Done');
  };

  const sendLightEffect = (req: express.Request, res: express.Response) => {
    //@ts-ignore
    req.socketServer!.emit('color-effect', req.params.effect);
    res.send('Done');
  };

  return {
    changeLightColor,
    sendLightEffect,
  };
}
