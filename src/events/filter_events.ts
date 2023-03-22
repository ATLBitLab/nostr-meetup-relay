import { readFile, writeFile, writeFileSync } from "fs";

import WebSocket from "ws";
import { auto } from "async";
import { defaults } from "../constants";
import sendError from "./send_error";
import { ReqType } from "../types";
import { isHex, isNumber, isArray } from "../utils";
import sendOk from "./send_ok";

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
            const req = args.req;
            const subId = req[1];
            const filters = req[2];
            const { ids, authors, kinds, since, until, limit } = { ...filters };
            const e = filters["#e"], p = filters["#p"];
            const eventKinds = Object.values(defaults.event_kinds);

            const nonHexIDs = authors.filter((a: string) => !isHex(a)).length > 0
            if (
                (ids && !ids.length) ||
                (ids && ids.length && (!isArray(ids) || nonHexIDs))
            ) {
                sendError({
                    error: "Invalid req ids to filter and subscribe",
                    id: subId,
                    ws: args.ws
                });
                return cbk(new Error());
            }

            const nonHexAuthors = authors.filter((a: string) => !isHex(a)).length > 0
            if (
                (authors && !authors.length) ||
                (authors && authors.length && (!isArray(authors) || nonHexAuthors))
            ) {
                sendError({
                    error: "Invalid field authors used to filter events",
                    id: subId,
                    ws: args.ws
                });
                return cbk(new Error());
            }

            const invalidKinds = kinds.filter((k: number) => !eventKinds.includes(k)).length > 0
            if (
                (kinds && !kinds.length) ||
                (!isArray(kinds) && invalidKinds)
            ) {
                sendError({
                    error: "Invalid req kinds to filter events",
                    id: subId,
                    ws: args.ws
                });
                return cbk(new Error());
            }

            const nonHexEs = e.filter((t: string) => !isHex(t)).length > 0
            if (
                (e && !e.length) ||
                (e && e.length && (!isArray(e) || nonHexEs))
            ) {
                sendError({
                    error: "Invalid req #e to filter events",
                    id: subId,
                    ws: args.ws
                });
                return cbk(new Error());
            }

            const nonHexPs = p.filter((t: string) => !isHex(t)).length > 0
            if (
                (p && !p.length) ||
                (p && p.length && (!isArray(p) || nonHexPs))
            ) {
                sendError({
                    error: "Invalid req #p to filter events",
                    id: subId,
                    ws: args.ws
                });
                return cbk(new Error());
            }

            if (since && !isNumber(since)) {
                sendError({ error: 'Invalid req since to filter events', id: subId, ws: args.ws });
                return cbk(new Error());
            }

            if (until && !isNumber(until)) {
                sendError({
                    error: "Invalid req until to filter events",
                    id: subId,
                    ws: args.ws
                });
                return cbk(new Error());
            }

            if (limit && !isNumber(limit)) {
                sendError({
                    error: "Invalid req limit to filter events",
                    id: subId,
                    ws: args.ws
                });
                return cbk(new Error());
            }

            return cbk();
        },

        // Read the data file
        readFile: [
            "validate",
            ({ }, cbk) => {
                readFile(defaults.data_path, "utf8", (err, res) => {
                    if (!!err) {
                        sendError({ error: err.message, ws: args.ws });
                        return cbk(new Error());
                    }

                    try {
                        const data = JSON.parse(res);

                        if (
                            !data.groups &&
                            !data.events &&
                            (!isArray(data.groups) && !isArray(data.events))
                        ) {
                            sendError({
                                error: "Invalid data file to filter events",
                                ws: args.ws
                            });
                            return cbk(new Error());
                        }

                        return cbk(null, data);
                    } catch (error: any) {
                        sendError({ error: error.message, ws: args.ws });
                        return cbk(new Error());
                    }
                });
            }
        ],

        filterEvents: [
            "readFile",
            "validate",
            ({ readFile }, cbk) => {
                const data = readFile;
                const filters = args.req[2];
                const subId = args.req[1];
                const { ids, authors, kinds, since, until, limit } = { ...filters }, e = filters["#e"], p = filters["#p"];
                const usableFilters: any = {}

                if (!data.events.length || !data.groups.length) {
                    sendError({
                        error: "No data in database to filter",
                        id: subId,
                        ws: args.ws
                    });
                    return cbk(new Error());
                }

                if (ids && ids.length) usableFilters['ids'] = ids
                if (authors && authors.length) usableFilters['authors'] = authors
                if (kinds && kinds.length) usableFilters['kinds'] = kinds
                if (e && e.length) usableFilters['e'] = e
                if (p && p.length) usableFilters['p'] = p
                if (since) usableFilters['since'] = since
                if (until) usableFilters['until'] = until
                if (limit) usableFilters['limit'] = limit

                // TODO: filter groups and events by #e / tag['e'], #p / tag['p'],

                const groups = data.groups
                    .sort((g1: any, g2: any) => (g1.created_at >= g2.created_at ? -1 : 1))
                    .filter(
                        (g: any) =>
                            usableFilters.kinds.includes(g.kind) &&
                            usableFilters.ids.includes(g.id) &&
                            usableFilters.authors.includes(g.pubkey) &&
                            g.created_at >= usableFilters.since &&
                            g.created_at <= usableFilters.until
                    );
                const meetings = data.events
                    .sort((e1: any, e2: any) => (e1.created_at >= e2.created_at ? -1 : 1))
                    .filter(
                        (e: any, i: number) =>
                            usableFilters.kinds.includes(e.kind) &&
                            usableFilters.ids.includes(e.id) &&
                            usableFilters.authors.includes(e.pubkey) &&
                            e.created_at >= usableFilters.since &&
                            e.created_at <= usableFilters.until &&
                            i <= usableFilters.limit
                    );

                let selection: any = [...groups, ...meetings];
                if (limit && isNumber(limit)) selection = selection.splice(0, limit);
                if (!selection.length) selection = "No meetings or groups found!";
                sendOk({ id: subId, message: selection, ws: args.ws });
                return cbk();
            }
        ]
    });
};

export default filterEvents;
