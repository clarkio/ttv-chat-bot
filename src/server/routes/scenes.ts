import express from 'express';

export const scenesRoute = (req: express.Request, res: express.Response) => {
  
  const { sceneName } = req.query;
  if (sceneName) {
    res.render(`index`, {
      iframeSrc: process.env[`${sceneName}`],
      sceneName
    });
  } else {
    res.status(400);
  }
};

// phrakberg was here too
