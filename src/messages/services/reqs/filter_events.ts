import { readFile, writeFile, writeFileSync } from 'fs';

import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../../../constants';
import sendError from '../../send_error';
import { ReqType } from '../../../types';

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
            const subId = req[1];
            const reqFilters = req[2];
            const eventKinds = Object.values(defaults.event_kinds)

            if (reqFilters.ids && !isArray(reqFilters.ids)) {
                sendError({ error: 'Invalid req ids to filter and subscribe', ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.authors && !isArray(reqFilters.authors)) {
                sendError({ error: 'Invalid field authors used to filter events', id: subId, ws: args.ws });
                return cbk(new Error());
            }

            if (
                reqFilters.kinds &&
                (!isArray(reqFilters.kinds) ||
                    (reqFilters.kinds.filter((k: number) => !eventKinds.includes(k))).length > 0)
            ) {
                sendError({ error: 'Invalid req kinds to filter events', id: subId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters['#e'] &&
                (!isArray(reqFilters['#e']) || reqFilters['#e'].length === 0)
            ) {
                sendError({ error: 'Invalid req #e to filter events', id: subId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters['#p'] &&
                (!isArray(reqFilters['#p']) || reqFilters['#p'].length === 0)
            ) {
                sendError({ error: 'Invalid req #p to filter events', id: subId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.since &&
                (
                    isNaN(Date.parse(String(reqFilters.since))) ||
                    typeof reqFilters.since !== 'number'
                )
            ) {
                sendError({ error: 'Invalid req since to filter events', id: subId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.until &&
                (
                    isNaN(Date.parse(String(reqFilters.until))) ||
                    typeof reqFilters.until !== 'number'
                )
            ) {
                sendError({ error: 'Invalid req until to filter events', id: subId, ws: args.ws });
                return cbk(new Error());
            }

            if (reqFilters.limit &&
                (
                    isNaN(Date.parse(String(reqFilters.limit))) ||
                    typeof reqFilters.limit !== 'number'
                )
            ) {
                sendError({ error: 'Invalid req limit to filter events', id: subId, ws: args.ws });
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
                const filters = args.req[2]
                const subId = args.req[1]
                const { ids, authors, kinds, since, until, limit } = { ...filters };
                const e = filters['#e'], p = filters['#p'];

                if (!data.events.length || !data.groups.length) {
                    sendError({ error: 'No data in database to filter', id: subId, ws: args.ws });
                    return cbk(new Error());
                }

                if ((ids && !ids.length) || (ids && ids.length && !isHex(ids[0]))) {
                    sendError({ error: 'Missing/Invalid "ids" in req, failed to filter events', id: subId, ws: args.ws });
                    return cbk(new Error());
                }

                if ((authors && !authors.length) || (authors && authors.length && !isHex(authors[0]))) {
                    sendError({ error: 'Missing/Invalid "authors" in req, failed to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if ((kinds && !kinds.length) || (kinds && kinds.length && !isNumber(kinds[0]))) {
                    sendError({ error: 'Missing/Invalid "kinds" in req, failed to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if ((e && !e.length) || (e && e.length && !isHex(e[0]))) {
                    sendError({ error: 'Missing/Invalid "#e" in req, failed to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if ((p && !p.length) || (p && p.length && !isHex(p[0]))) {
                    sendError({ error: 'Missing/Invalid req "#p", failed to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if (since || !isNumber(since)) {
                    sendError({ error: 'Missing/Invalid req "since", failed to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if (until || !isNumber(until)) {
                    sendError({ error: 'Missing/Invalid req "until", failed to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                if (limit && !isNumber(limit)) {
                    sendError({ error: 'Missing/Invalid req "limit", failed to filter events', ws: args.ws });
                    return cbk(new Error());
                }

                const filteredGroups = data.groups.sort(
                    (g1: any, g2: any) => g1.created_at >= g2.created_at ? -1 : 1
                ).filter((g: any, i: number) =>
                    filters.kinds.includes(g.kind) &&
                    filters.ids.includes(g.id) &&
                    filters.authors.includes(g.pubkey) &&
                    g.created_at >= filters.since &&
                    g.created_at <= filters.until &&
                    i <= filters.limit
                )
                const filteredEvents = data.events.sort(
                    (e1: any, e2: any) => e1.created_at >= e2.created_at ? -1 : 1
                ).filter((e: any, i: number) =>
                    filters.kinds.includes(e.kind) &&
                    filters.ids.includes(e.id) &&
                    filters.authors.includes(e.pubkey) &&
                    e.created_at >= filters.since &&
                    e.created_at <= filters.until &&
                    i <= filters.limit
                )

                // TODO: filter groups and events by #e / tag['e'], #p / tag['p'], 

                return cbk(null, { events: [...filteredEvents, ...filteredGroups] });

            },
        ]
    });
};

export default filterEvents;
