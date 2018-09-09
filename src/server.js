"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const config_1 = require("./config");
const index_1 = require("./index");
const lights_1 = require("./routes/lights");
const scenes_1 = require("./routes/scenes");
// import config from './config';
// const config = require('./config');
// const { port } = config;
class App {
    constructor() {
        this.listen = () => {
            const runningMessage = `Overlay server is running on port http://localhost:${config_1.port}`;
            this.app.listen(config_1.port, () => {
                console.log(runningMessage);
            });
        };
        this.app = express();
        this.overlay = index_1.overlay;
        this.routes();
        this.config();
        this.listen();
    }
    getApp() {
        return this.app;
    }
    config() {
        this.app.set('view engine', 'pug');
        this.app.set('views', `${__dirname}/views`);
        this.app.use(express.static(__dirname));
    }
    routes() {
        const router = express.Router();
        router.get('/scenes', scenes_1.scenesRoute);
        router.get('/overlay-colors', (req, res) => {
            res.render('overlay-colors');
        });
        router.get('/lights/:color', lights_1.changeLightColor);
        router.get('/lights/effects/:effect', lights_1.sendLightEffect);
        router.get('/bulb/color', (req, res) => {
            const currentColor = this.overlay.getCurrentColor();
            res.json({ color: currentColor });
        });
        this.app.use('/', router);
    }
}
exports.App = App;
//# sourceMappingURL=server.js.map