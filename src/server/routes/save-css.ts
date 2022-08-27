import { writeCssFile } from '../file-handler';
import express from 'express';

export const saveCssRoute = (req: express.Request, res: express.Response) => {
  const { colorName, hueRotateDeg } = req.body;
  const data = formatForCSS(colorName, hueRotateDeg);
  writeCssFile(data)
    .then(() => {
      res.send({ message: 'Saved' });
    })
    .catch((error: any) => {
      console.error(error);
      res.status(500).send("There was an issue saving the CSS you created");
    });
};

function formatForCSS(colorName: string, hueRotateDeg: string) {
  return `.${colorName} {\n  filter: hue-rotate(${hueRotateDeg}deg);\n}\n`;
}
