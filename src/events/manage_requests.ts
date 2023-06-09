import { Subscription } from '../types';
import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import filterEvents from './filter_events';
import sendError from './send_error';
import { isArray, parse } from '../utils'

/** Manage events
 * @param {string} args.req
 * @param {WebSocket} args.ws
 *
 * @returns {Promise<void>}
 */
type Args = {
  req: string;
  ws: WebSocket;
  subs: Map<string, Subscription>;
};
const manageRequests = async (args: Args) => {
  return await auto({
    // Check arguments
    validate: cbk => {
      try {
        const req = parse(args.req);
        if (!isArray(req) || req.length < 3) {
          sendError({ error: 'Invalid req', ws: args.ws });
          return cbk(new Error());
        }
        if (!defaults.message_types.includes(req[0])) {
          sendError({ error: 'Invalid req type', ws: args.ws });
          return cbk(new Error());
        }
        const subscriptionId = req[1];
        const active = args.subs.get(subscriptionId);
        const activeQuery: any = active?.query || '';
        const updated = activeQuery != '' && activeQuery !== req;
        if (!active || updated) {
          const sub = new Subscription(JSON.stringify(req), 0);
          args.subs.set(subscriptionId, sub);
        }
        return cbk();
      } catch (error: any) {
        sendError({ error: error.message, ws: args.ws });
        return cbk(new Error(error.message));
      }
    },

    // Return the parsed req
    parseReq: [
      'validate',
      ({ }, cbk) => {
        return cbk(null, { req: parse(args.req) });
      },
    ],

    filterEvents: [
      'parseReq',
      async ({ parseReq }: any) => {
        try {
          if (
            parseReq.req[0] !== defaults.req_event_type ||
            parseReq.req[1].length < 1 ||
            parseReq.req[1].length > 64 ||
            typeof parseReq.req[1] !== 'string'
          ) {
            return;
          }
          await filterEvents({ req: parseReq.req, ws: args.ws, subs: args.subs });
          return;
        } catch (error: any) {
          return;
        }
      },
    ],
  });
};

export default manageRequests;
