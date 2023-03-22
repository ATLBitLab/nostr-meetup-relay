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
        const result = parse(args.req);

        if (!isArray(result) || result.length < 3) {
          sendError({ error: 'Invalid req', ws: args.ws });
          return cbk(new Error());
        }

        if (!defaults.message_types.includes(result[0])) {
          sendError({ error: 'Invalid req type', ws: args.ws });
          return cbk(new Error());
        }
        const subscriptionId = result[1];
        const active = args.subs.get(subscriptionId);
        const activeQuery: any = active?.query || '';
        const updated = activeQuery != '' && activeQuery !== result;
        if (!active || updated) {
          const sub = new Subscription(JSON.stringify(result), 0);
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
        // Exit early when not inserting a group
        try {
          if (
            parseReq.req[0] !== defaults.req_event_type ||
            parseReq.req[1].length < 1 ||
            parseReq.req[1].length > 64 ||
            typeof parseReq.req[1] !== 'string'
          ) {
            return;
          }
          console.log('subscriptionId', parseReq.req[1]);
          console.log('filters', parseReq.req[2]);
          await filterEvents({ req: parseReq.req, ws: args.ws });
          return;
        } catch (error: any) {
          return;
        }
      },
    ],
  });
};

export default manageRequests;
