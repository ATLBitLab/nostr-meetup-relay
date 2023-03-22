import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../../constants';
import filterEvents from '../services/reqs/filter_events';
import sendError from '../send_error';
import { Subscription } from '../../types';

const { parse } = JSON;
const { isArray } = Array;

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
const manageReqs = async (args: Args) => {
    return await auto({
        // Check arguments
        validate: cbk => {
            try {
                const result = parse(args.req);
                console.log('result', result)
                console.log('subs0', args.subs)


                if (!isArray(result) || result.length < 3) {
                    console.log('if1')
                    sendError({ error: 'Invalid req', ws: args.ws });
                    return cbk(new Error());
                }

                if (!defaults.message_types.includes(result[0])) {
                    console.log('if2')
                    sendError({ error: 'Invalid req type', ws: args.ws });
                    return cbk(new Error());
                }

                const subId = result[1]
                console.log('subId', subId)
                const active = args.subs.get(subId);
                console.log('active', active)
                const activeQuery: any = active?.query || '';
                console.log('activeQuery', activeQuery)
                const updated = activeQuery != '' && activeQuery !== result;
                console.log('updated', updated)
                if (!active || updated) {
                    console.log('if3')
                    const sub = new Subscription(JSON.stringify(result), 0);
                    console.log('sub', sub)
                    args.subs.set(subId, sub);
                }
                console.log('subs1', args.subs)

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
                    console.log('subId', parseReq.req[1]);
                    console.log('filters', parseReq.req[2]);
                    await filterEvents({ req: parseReq.req, ws: args.ws });
                    return;
                } catch (error: any) {
                    return;
                }
            },
        ],
        storeFilter: [],


    });
};

export default manageReqs;
