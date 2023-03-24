import { readFile, writeFile } from 'fs';
import { Subscription } from '../types';

import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import sendError from './send_error';
import { ReqType } from '../types';
import { isHex, isNumber, stringify, isArray } from '../utils'
import sendEvent from './send_event';
import sendEose from './send_eose';

/** Inserts events to a json file
 * @param {InsertEventType} args.event
 * @param {WebSocket} args.ws
 *
 * @returns {Promise<void>}
 */
type Args = {
    req: ReqType;
    ws: WebSocket;
    subs: Map<string, Subscription>;
};
const filterEvents = async (args: Args) => {
    return await auto({
        // Check arguments
        validate: cbk => {
            const req = args.req;
            const subId = req[1];
            const filters = req[2];
            const { ids, authors, kinds, since, until, limit } = { ...filters };
            const e = filters['#e'],
                p = filters['#p'];
            const eventKinds = Object.values(defaults.event_kinds);

            if (ids) {
                if (!isArray(ids)) {
                    sendError({
                        error: 'Invalid req: ids must be array',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }

                if (ids.length === 0) {
                    sendError({
                        error: 'Invalid req: ids array cannot be length 0',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }

                const nonHexIDs = ids.filter(a => !isHex(a)).length > 0;
                if (nonHexIDs) {
                    sendError({
                        error: 'Invalid req: ids array must contain hex strings',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
            }

            if (authors) {
                if (!isArray(authors)) {
                    sendError({
                        error: 'Invalid req: authors must be array',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }

                if (authors.length === 0) {
                    sendError({
                        error: 'Invalid req: authors array cannot be length 0',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }

                const nonHexAuthors = authors.filter((a: string) => !isHex(a)).length > 0;
                if (nonHexAuthors) {
                    sendError({
                        error: 'Invalid req filter: authors array must contain hex strings',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
            }

            if (kinds) {
                if (!isArray(kinds)) {
                    sendError({
                        error: 'Invalid req: kinds must be array',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
                if (kinds.length === 0) {
                    sendError({
                        error: 'Invalid req: kinds array cannot be length 0',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
                const invalidKinds = kinds.filter((k: number) => !eventKinds.includes(k)).length > 0;
                if (invalidKinds) {
                    sendError({
                        error: 'Invalid req filter: kinds array must contain hex strings',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
            }

            if (e) {
                if (!isArray(e)) {
                    sendError({
                        error: 'Invalid req: e must be array',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
                if (e.length === 0) {
                    sendError({
                        error: 'Invalid req: e array cannot be length 0',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
                const nonHexEs = e.filter((t: string) => !isHex(t)).length > 0;
                if (nonHexEs) {
                    sendError({
                        error: 'Invalid req filter: e array must contain hex strings',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
            }

            if (p) {
                if (!isArray(p)) {
                    sendError({
                        error: 'Invalid req: p must be array',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
                if (p.length === 0) {
                    sendError({
                        error: 'Invalid req: p array cannot be length 0',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
                const nonHexPs = p.filter((t: string) => !isHex(t)).length > 0;
                if (nonHexPs) {
                    sendError({
                        error: 'Invalid req filter: p array must contain hex strings',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
            }

            if (since) {
                if (!isNumber(since)) {
                    sendError({ error: 'Invalid req filter: since must be a number', id: subId, ws: args.ws });
                    return cbk(new Error());
                }
            }

            if (until) {
                if (!isNumber(until)) {
                    sendError({
                        error: 'Invalid req filter: until must be a number',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
            }

            if (limit) {
                if (!isNumber(limit)) {
                    sendError({
                        error: 'Invalid req filter: limit must be a number',
                        id: subId,
                        ws: args.ws,
                    });
                    return cbk(new Error());
                }
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

                        if (!data.groups && !data.events && !isArray(data.groups) && !isArray(data.events)) {
                            sendError({
                                error: 'Invalid data file to filter events',
                                ws: args.ws,
                            });
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
                const filters = args.req[2];
                const subId = args.req[1];
                const { ids, authors, kinds, since, until, limit } = { ...filters },
                    e = filters['#e'],
                    p = filters['#p'];
                const usableFilters: any = {};
                if (ids && ids.length) usableFilters['ids'] = ids;
                if (authors && authors.length) usableFilters['authors'] = authors;
                if (kinds && kinds.length) usableFilters['kinds'] = kinds;
                if (e && e.length) usableFilters['e'] = e;
                if (p && p.length) usableFilters['p'] = p;
                if (since) usableFilters['since'] = since;
                if (until) usableFilters['until'] = until;
                if (limit) usableFilters['limit'] = limit;
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~GROUPS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                let groups: any = [];
                if (data.groups) {
                    groups = data.groups.sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? 1 : -1));
                    if (usableFilters.kinds) groups = groups.filter((g: any) => usableFilters.kinds.includes(g.kind));
                    if (usableFilters.ids) groups = groups.filter((g: any) => usableFilters.ids.includes(g.id));
                    if (usableFilters.authors) groups = groups.filter((g: any) => usableFilters.authors.includes(g.pubkey));
                    if (usableFilters.e) groups = groups.filter((g: any) => usableFilters.e.filter((e: any) => g.tags[0][0] === 'e' && g.tags[0][1] === e))
                    if (usableFilters.p) groups.filter((g: any) => usableFilters.p.filter((p: any) => g.tags[0][0] === 'p' && g.tags[0][1] === p))
                    if (usableFilters.since) groups = groups.filter((g: any) => g.created_at >= usableFilters.since);
                    if (usableFilters.until) groups = groups.filter((g: any) => g.created_at <= usableFilters.until);
                }
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~MEETINGS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                let meetings: any = [];
                if (data.events) {
                    meetings = data.events.sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? 1 : -1));
                    if (usableFilters.kinds) meetings = meetings.filter((g: any) => usableFilters.kinds.includes(g.kind));
                    if (usableFilters.ids) meetings = meetings.filter((g: any) => usableFilters.ids.includes(g.id));
                    if (usableFilters.authors) meetings = meetings.filter((g: any) => usableFilters.authors.includes(g.pubkey));
                    if (usableFilters.e) meetings = meetings.filter((m: any) => usableFilters.e.filter((e: any) => m.tags[0][0] === 'e' && m.tags[0][1] === e))
                    if (usableFilters.p) meetings.filter((m: any) => usableFilters.p.filter((p: any) => m.tags[0][0] === 'p' && m.tags[0][1] === p))
                    if (usableFilters.since) meetings = meetings.filter((g: any) => g.created_at >= usableFilters.since);
                    if (usableFilters.until) meetings = meetings.filter((g: any) => g.created_at <= usableFilters.until);
                }
                let events: any = [...groups, ...meetings];
                if (isNumber(limit)) events = events.splice(0, limit);
                const active: any = args.subs.get(subId)
                events = events.filter((e: any) => e.created_at > active?.lastEvent || 0);
                const lastEvent = events[events.length - 1];
                if (lastEvent) {
                    active.lastEvent = lastEvent.created_at;
                    args.subs.set(subId, active);
                }
                writeFile(defaults.subs_path, stringify(Object.fromEntries(args.subs)), 'utf8', err => {
                    if (!!err) {
                        sendError({ error: err.message, id: subId, ws: args.ws });
                        return cbk(new Error());
                    }
                });
                for (let event of events) if (event) sendEvent({ id: subId, message: event, ws: args.ws })
                sendEose({ id: subId, ws: args.ws })
                return cbk();
            },
        ],
    });
};

export default filterEvents;
