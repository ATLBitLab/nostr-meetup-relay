import WebSocket, { WebSocketServer } from 'ws';

import { auto } from 'async';
import { defaults } from '../constants';
import { manageEvents, manageReqs } from '../messages';

const { parse } = JSON;
const subs = new Map();

/** Start websocket server
 *
 * @returns {Promise<void>}
 */
const startWebsocket = async () => {
  return await auto({
    start: cbk => {
      console.log(`Starting websocket server on port ${defaults.port}...`);

      const wss = new WebSocketServer({ port: Number(defaults.port) });

      wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected');
        ws.on('message', async (message: string) => {
          try {
            parse(message)[0] === 'EVENT' ? manageEvents({ event: message, ws }) : manageReqs({ req: message, ws, subs })
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
