import WebSocket, { WebSocketServer } from 'ws';

import { auto } from 'async';
import { defaults } from '../constants';
import { manageEvents } from '../events';

const startWebsocket = async () => {
  return await auto({
    start: cbk => {
      console.log(`Starting websocket server on port ${defaults.port}...`);

      const wss = new WebSocketServer({ port: Number(defaults.port) });

      wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected');

        ws.on('message', async (message: string) => {
          try {
            manageEvents({ event: message, ws });
          } catch (error: any) {
            console.error(`Error => ${error.message}`);
          }
        });
      });

      wss.on('close', () => {
        console.log('Client disconnected');
      });

      wss.on('error', (error: Error) => {
        console.error(`Error => ${error.message}`);
      });
    },
  });
};

export default startWebsocket;
