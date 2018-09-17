import express from 'express';
import * as files from '../files';

export const saveCssRoute = (req: express.Request, res: express.Response) => {
  const captains = console;
  captains.log(req.body);
  const { colorName, hueRotateDeg } = req.body;
  const data = formatForCSS(colorName, hueRotateDeg);
  files
    .write(data)
    .then((result: any) => {
      res.send({ message: 'Saved' });
    })
    .catch((error: any) => {
      res.status(500).send(error);
    });
};

function formatForCSS(colorName: string, hueRotateDeg: string) {
  return `.${colorName} {\n  filter: hue-rotate(${hueRotateDeg}deg);\n}\n`;
}
