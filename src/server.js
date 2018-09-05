"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const overlay_1 = require("./overlay");
// import config from './config';
// const config = require('./config');
// const { port } = config;
class App {
    constructor() {
        this.app = express_1.default();
        this.overlay = new overlay_1.Overlay();
        this.routes();
        this.config();
    }
    getApp() {
        return this.app;
    }
    config() {
        this.app.set('view engine', 'pug');
        this.app.set('views', `${__dirname}/views`);
        this.app.use(express_1.default.static(__dirname));
    }
    routes() {
        const router = express_1.default.Router();
        router.get('/scenes', (req, res) => {
            const { sceneName } = req.query;
            if (sceneName) {
                res.render(`index`, {
                    iframeSrc: process.env[`${sceneName}`]
                });
            }
            else {
                res.status(400);
            }
        });
        router.get('/overlay-colors', (req, res) => {
            res.render('overlay-colors');
        });
        router.get('/lights/:color', (req, res) => {
            const io = this.overlay.getSocket();
            io.emit('color-change', req.params.color);
            res.send('Done');
        });
        router.get('/lights/effects/:effect', (req, res) => {
            const io = this.overlay.getSocket();
            io.emit('color-effect', req.params.effect);
            res.send('Done');
        });
        router.get('/bulb/color', (req, res) => {
            const currentColor = this.overlay.getCurrentColor();
            res.json({ color: currentColor });
        });
    }
}
exports.App = App;
//# sourceMappingURL=server.js.map