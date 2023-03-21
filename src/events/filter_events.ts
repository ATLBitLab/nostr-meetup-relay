import { readFile, writeFile, writeFileSync } from 'fs';

import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import sendError from './send_error';
import { ReqType } from '../types';

const hexAsBuffer = (hex: string) => Buffer.from(hex, 'hex');
const { isArray } = Array;
const isHex = (n: string) => !!n && !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isNumber = (n: any) => typeof n === 'number';
const stringify = (n: any) => JSON.stringify(n, null, 2);

/** Inserts events to a json file
 * @param {InsertEventType} args.event
 * @param {WebSocket} args.ws
 *
 * @returns {Promise<void>}
 */
type Args = {
    req: ReqType;
    ws: WebSocket;
};
const filterEvents = async (args: Args) => {
    return await auto({
        // Check arguments
        validate: cbk => {
            const req = args.req
            const subscriptionId = req[1];
            const reqFilters = req[2];
            const eventKinds = Object.values(defaults.event_kinds)

            if (reqFilters.ids && !isArray(reqFilters.ids)) {
                sendError({ error: 'Invalid req ids to filter and subscribe', ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.authors && !isArray(reqFilters.authors)) {
                sendError({ error: 'Invalid field authors used to filter events', id: subscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (
                reqFilters.kinds &&
                (!isArray(reqFilters.kinds) ||
                    (reqFilters.kinds.filter((k: number) => !eventKinds.includes(k))).length > 0)
            ) {
                sendError({ error: 'Invalid req kinds to filter events', id: subscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters['#e'] &&
                (!isArray(reqFilters['#e']) || reqFilters['#e'].length === 0)
            ) {
                sendError({ error: 'Invalid req #e to filter events', id: subscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters['#p'] &&
                (!isArray(reqFilters['#p']) || reqFilters['#p'].length === 0)
            ) {
                sendError({ error: 'Invalid req #p to filter events', id: subscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.since &&
                (
                    isNaN(Date.parse(String(reqFilters.since))) ||
                    typeof reqFilters.since !== 'number'
                )
            ) {
                sendError({ error: 'Invalid req since to filter events', id: subscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.until &&
                (
                    isNaN(Date.parse(String(reqFilters.until))) ||
                    typeof reqFilters.until !== 'number'
                )
            ) {
                sendError({ error: 'Invalid req until to filter events', id: subscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.limit &&
                (
                    isNaN(Date.parse(String(reqFilters.limit))) ||
                    typeof reqFilters.limit !== 'number'
                )
            ) {
                sendError({ error: 'Invalid req limit to filter events', id: subscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            return cbk();
        },

        // Read the data file
        readFile: [
            'validate',
            ({ }, cbk) => {
                readFile(defaults.data_path, 'utf8', (err, res) => {
                    if (!!err) {
                        sendError({ error: err.message, ws: args.ws });
                        return cbk(new Error());
                    }

                    try {
                        const data = JSON.parse(res);

                        if (
                            (!data.groups && !data.events) && (!isArray(data.groups) && !isArray(data.events))
                        ) {
                            sendError({ error: 'Invalid data file to filter events', ws: args.ws });
                            return cbk(new Error());
                        }

                        return cbk(null, data);
                    } catch (error: any) {
                        sendError({ error: error.message, ws: args.ws });
                        return cbk(new Error());
                    }
                });
            },
        ],

        filterEvents: [
            'readFile',
            'validate',
            ({ readFile }, cbk) => {
                const data = readFile;
                const req = args.req[2]
                const subId = args.req[1]
                const { ids, authors, kinds, since, until, limit } = { ...req };
                const e = args.req[2]['#e'], p = args.req[2]['#p'];

                if (!data.events.length || !data.groups.length) {
                    sendError({ error: 'No data in database to filter', id: subId, ws: args.ws });
                    return cbk(new Error());
                }

                if ((ids && !ids.length) || (ids && ids.length && !isHex(ids[0]))) {
                    sendError({ error: 'Missing req ids to filter events', id: subId, ws: args.ws });
                    return cbk(new Error());
                }

                if ((authors && !authors.length) || (authors && authors.length && !isHex(authors[0]))) {
                    sendError({ error: 'Missing req authors to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if ((kinds && !kinds.length) || (kinds && kinds.length && !isNumber(kinds[0]))) {
                    sendError({ error: 'Missing req authors to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if ((e && !e.length) || (e && e.length && !isHex(e[0]))) {
                    sendError({ error: 'Missing req authors to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if ((p && !p.length) || (p && p.length && !isHex(p[0]))) {
                    sendError({ error: 'Missing req authors to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if (since || !isNumber(since)) {
                    sendError({ error: 'Missing req authors to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if (until || !isNumber(until)) {
                    sendError({ error: 'Missing req authors to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if (limit && !isNumber(limit)) {
                    sendError({ error: 'Missing req authors to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                // TODO: filter events

                // const matchingEvents = data.events.find((e: any) => e.pubkey === authors[0] && e.kind === kinds[0] && e.tags[0][1]);
                // const pTagId = req.tags[1].find((t: string) => isHex(t));
                // const eTag = req.tags[0].find((t: string) => t === 'e');
                // const eTagId = req.tags[0].find((t: string) => isHex(t));



                // Check if a reference event exists for rsvp
                // const findReferenecEvent = data.events.find((e: any) => e.id === eTagId);

                // if (!findReferenecEvent) {
                //     sendError({ error: 'Missing reference event to rsvp event', id: subId, ws: args.ws });
                //     return cbk(new Error());
                // }

                return cbk(null, { events: [] });

            },
        ]
    });
};

export default filterEvents;
