"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const async_1 = require("async");
const constants_1 = require("../constants");
const startWebsocket = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, async_1.auto)({
        start: () => {
            console.log(`Starting websocket server on port ${constants_1.defaults.port}...`);
            const wss = new ws_1.WebSocketServer({ port: constants_1.defaults.port });
        },
    });
});
exports.default = startWebsocket;
