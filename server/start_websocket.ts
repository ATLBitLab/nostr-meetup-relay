import WebSocket, { WebSocketServer } from 'ws';

import { auto } from 'async';
import { defaults } from './constants.ts';

const startWebsocket = async () => {
  return await auto({
    start: () => {
      console.log(`Starting websocket server on port ${defaults.port}...`);
      const wss = new WebSocketServer({ port: defaults.port });
    },
  });
};

export default startWebsocket;
