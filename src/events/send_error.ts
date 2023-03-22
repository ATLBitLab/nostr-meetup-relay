import WebSocket from 'ws';

import { stringify } from '../utils'
const messageType = 'OK';

/** Send an error message to the client
 * @param {string} args.error
 * @param {string} args.id
 * @param {WebSocket} args.ws
 *
 * @returns {void}
 */
type Args = {
  error: String;
  id?: String;
  ws: WebSocket;
};
const sendError = (args: Args) => {
  const message = [messageType, args.id || '', false, `[ERROR]: ${args.error}`];
  console.error(`Error => ${args.error}`);

  args.ws.send(stringify(message));
};

export default sendError;
