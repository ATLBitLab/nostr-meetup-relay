import { readFile, writeFile, writeFileSync } from 'fs';

import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import sendError from './send_error';
import { ReqType } from '../types';
import { isHex, isNumber, isArray } from '../utils';
import sendOk from './send_ok';

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
      ({}, cbk) => {
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

        console.log('data', data);
        console.log('data.groups.legnth', data.groups.length);

        // TODO: logic here is off i think
        // if (!data.events.length || !data.groups.length) {
        //   sendError({
        //     error: 'No data in database to filter',
        //     id: subId,
        //     ws: args.ws,
        //   });
        //   return cbk(new Error());
        // }

        if (ids && ids.length) usableFilters['ids'] = ids;
        if (authors && authors.length) usableFilters['authors'] = authors;
        if (kinds && kinds.length) usableFilters['kinds'] = kinds;
        if (e && e.length) usableFilters['e'] = e;
        if (p && p.length) usableFilters['p'] = p;
        if (since) usableFilters['since'] = since;
        if (until) usableFilters['until'] = until;
        if (limit) usableFilters['limit'] = limit;

        // TODO: filter groups and events by #e / tag['e'], #p / tag['p'],

        console.log('filters', usableFilters);
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~GROUPS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let groups: any = data.groups;
        // first filter out ones that don't have the kind
        if (data.groups) {
          if (usableFilters.kinds) {
            console.log('filtering by kinds');
            groups = groups
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => usableFilters.kinds.includes(g.kind));
          }
          if (usableFilters.ids) {
            console.log('filtering by ids');
            console.log('id', usableFilters.ids);
            console.log('groups before', groups);
            groups = groups
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => usableFilters.ids.includes(g.id));
            console.log('groups after', groups);
          }
          if (usableFilters.authors) {
            console.log('filtering by authors');
            groups = groups
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => usableFilters.authors.includes(g.pubkey));
          }
          if (usableFilters.since) {
            console.log('filtering by since');
            groups = groups
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => g.created_at >= usableFilters.since);
          }
          if (usableFilters.until) {
            console.log('filtering by until');
            groups = groups
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => g.created_at <= usableFilters.until);
          }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~MEETINGS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        console.log('data.meetings', data.meetings);

        let meetings: any = [];
        if (data.meetings) {
          if (usableFilters.kinds) {
            console.log('filtering by kinds');
            meetings = meetings
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => usableFilters.ids.includes(g.kind));
          }
          if (usableFilters.ids) {
            console.log('filtering by ids');
            console.log('id', usableFilters.id);
            meetings = meetings
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => usableFilters.ids.includes(g.id));
          }
          if (usableFilters.authors) {
            console.log('filtering by authors');
            meetings = meetings
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => usableFilters.ids.includes(g.pubkey));
          }
          if (usableFilters.since) {
            console.log('filtering by since');
            meetings = meetings
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => g.created_at >= usableFilters.since);
          }
          if (usableFilters.until) {
            console.log('filtering by until');
            meetings = meetings
              .sort((g1: any, g2: any) => (g1.created_at >= g2.greated_at ? -1 : 1))
              .filter((g: any) => g.created_at <= usableFilters.until);
          }
        }

        let selection: any = [...groups, ...meetings];
        if (limit && isNumber(limit)) selection = selection.splice(0, limit);
        if (!selection.length) selection = 'No meetings or groups found!';
        sendOk({ id: subId, message: selection, ws: args.ws });
        return cbk();
      },
    ],
  });
};

export default filterEvents;
