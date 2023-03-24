import WebSocket from 'ws';
import { stringify } from '../utils'
const messageType = 'EOSE';

/** Send an EOSE message to the client
 * @param {string} args.id
 * @param {WebSocket} args.ws
 *
 * @returns {void}
 */
type Args = {
  id: String;
  ws: WebSocket;
};
const sendEose = (args: Args) => {
  const message = [messageType, args.id];
  console.log('Success =>', messageType, args.id);

  args.ws.send(stringify(message));
};

export default sendEose;
