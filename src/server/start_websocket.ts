import WebSocket, { WebSocketServer } from 'ws';

import { auto } from 'async';
import { defaults } from '../constants';

const startWebsocket = async () => {
  return await auto({
    start: () => {
      console.log(`Starting websocket server on port ${defaults.port}...`);
      const wss = new WebSocketServer({ port: Number(defaults.port) });

      wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected');
        ws.on('message', (message: string) => {
          console.log(`Received message => ${message}`);
        });
        ws.send('Hello! Message From Server!!');
      });
    },
  });
};

export default startWebsocket;
