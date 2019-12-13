import { writeCssFile } from '../file-manager';
import express from 'express';

export const saveCssRoute = (req: express.Request, res: express.Response) => {
  const { colorName, hueRotateDeg } = req.body;
  const data = formatForCSS(colorName, hueRotateDeg);
  writeCssFile(data)
    .then(() => {
      res.send({ message: 'Saved' });
    })
    .catch((error: any) => {
      res.status(500).send(error);
    });
};

function formatForCSS(colorName: string, hueRotateDeg: string) {
  return `.${colorName} {\n  filter: hue-rotate(${hueRotateDeg}deg);\n}\n`;
}
