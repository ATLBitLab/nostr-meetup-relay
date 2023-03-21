import { readFile, writeFile, writeFileSync } from 'fs';

import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import sendError from './send_error';
import sendOk from './send_ok';
import { verifySchnorr } from 'tiny-secp256k1';
import { ReqType } from '../types';

const hexAsBuffer = (hex: string) => Buffer.from(hex, 'hex');
const { isArray } = Array;
const isHex = (n: string) => !!n && !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
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
            const reqSubscriptionId = req[1];
            const reqFilters = args.req[2];
            const eventKinds = Object.values(defaults.event_kinds)


            if (reqFilters.ids && !isArray(reqFilters.ids)) {
                sendError({ error: 'Invalid req ids to filter and subscribe', ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.authors && !isArray(reqFilters.authors)) {
                sendError({ error: 'Invalid field authors used to filter events', id: reqSubscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (
                reqFilters.kinds &&
                (!isArray(reqFilters.kinds) ||
                    (reqFilters.kinds.filter((k: number) => !eventKinds.includes(k))).length > 0)
            ) {
                sendError({ error: 'Invalid req kinds to filter events', id: reqSubscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters['#e'] &&
                (!isArray(reqFilters['#e']) || reqFilters['#e'].length === 0)
            ) {
                sendError({ error: 'Invalid req #e to filter events', id: reqSubscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters['#p'] &&
                (!isArray(reqFilters['#p']) || reqFilters['#p'].length === 0)
            ) {
                sendError({ error: 'Invalid req #p to filter events', id: reqSubscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.since &&
                (
                    isNaN(Date.parse(String(reqFilters.since))) ||
                    typeof reqFilters.since !== 'number'
                )
            ) {
                sendError({ error: 'Invalid req since to filter events', id: reqSubscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.until &&
                (
                    isNaN(Date.parse(String(reqFilters.until))) ||
                    typeof reqFilters.until !== 'number'
                )
            ) {
                sendError({ error: 'Invalid req until to filter events', id: reqSubscriptionId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.limit &&
                (
                    isNaN(Date.parse(String(reqFilters.limit))) ||
                    typeof reqFilters.limit !== 'number'
                )
            ) {
                sendError({ error: 'Invalid req limit to filter events', id: reqSubscriptionId, ws: args.ws });
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
                const { ids, authors, kinds, since, until, limit } = { ...args.req[2] };
                const e = args.req[2]['#e'], p = args.req[2]['#p'];

                if (!data.events.length || !data.groups.length) {
                    sendError({ error: 'No data in database to filter', id: args.req[1], ws: args.ws });
                    return cbk(new Error());
                }

                if (!event.tags.length || !event.tags[0].length || !event.tags[1].length) {
                    sendError({ error: 'Missing event tags to rsvp event', id: event.id, ws: args.ws });
                    return cbk(new Error());
                }
                const eTag = event.tags[0].find((t: string) => t === 'e');
                const eTagId = event.tags[0].find((t: string) => isHex(t));

                if (!eTag || !eTagId) {
                    sendError({ error: 'Expected valid e tag to rsvp event', ws: args.ws });
                    return cbk(new Error());
                }

                const pTag = event.tags[1].find((t: string) => t === 'p');
                const pTagId = event.tags[1].find((t: string) => isHex(t));

                if (!pTag || !pTagId) {
                    sendError({ error: 'Expected valid p tag to rsvp event', ws: args.ws });
                    return cbk(new Error());
                }

                // Check if a reference event exists for rsvp
                const findReferenecEvent = data.events.find((e: any) => e.id === eTagId);

                if (!findReferenecEvent) {
                    sendError({ error: 'Missing reference event to rsvp event', id: event.id, ws: args.ws });
                    return cbk(new Error());
                }

                return cbk(null, { tags: event.tags });

            },
        ]
    });
};

export default filterEvents;
