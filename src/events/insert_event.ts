import { readFile, writeFile, writeFileSync } from 'fs';

import { InsertEventType } from '../types';
import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import sendError from './send_error';
import sendOk from './send_ok';
import { verifySchnorr } from 'tiny-secp256k1';

const hexAsBuffer = (hex: string) => Buffer.from(hex, 'hex');
const { isArray } = Array;
const isHex = (n: string) => !!n && !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const stringify = (n: any) => JSON.stringify(n, null, 2);

type Args = {
  event: InsertEventType;
  ws: WebSocket;
};
const insertEvent = async (args: Args) => {
  return await auto({
    validate: cbk => {
      const event = args.event[1];

      if (!event.id || !isHex(event.id)) {
        sendError({ error: 'Missing/invalid event id', ws: args.ws });
        return cbk(new Error());
      }

      if (!event.pubkey || !isHex(event.pubkey)) {
        sendError({ error: 'Missing creator pubkey', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.created_at || Date.parse(String(event.created_at))) {
        sendError({ error: 'Missing/Invalid event created_at', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.kind || (event.kind !== defaults.event_kinds.insert && event.kind !== defaults.event_kinds.rsvp)) {
        sendError({ error: 'Missing/invalid event kind', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.tags || !isArray(event.tags)) {
        sendError({ error: 'Missing event tags', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.content) {
        sendError({ error: 'Missing event content', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.sig) {
        sendError({ error: 'Missing event sig', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      try {
        if (!verifySchnorr(hexAsBuffer(event.id), hexAsBuffer(event.pubkey), hexAsBuffer(event.sig))) {
          sendError({ error: 'Invalid event sig', id: event.id, ws: args.ws });
          return cbk(new Error());
        }
      } catch (error: any) {
        sendError({ error: error.message, id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      return cbk();
    },

    readFile: [
      'validate',
      ({}, cbk) => {
        readFile(defaults.data_path, 'utf8', (err, res) => {
          if (!!err) {
            writeFileSync(defaults.data_path, stringify({ events: [] }));
            return cbk(null, { data: { events: [] } });
          }

          try {
            const data = JSON.parse(res);

            if (!data.events || !isArray(data.events)) {
              sendError({ error: 'Invalid data file', ws: args.ws });
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

    findTags: [
      'readFile',
      'validate',
      ({ readFile }, cbk) => {
        const data = readFile;

        if (!data.events.length) {
          return cbk();
        }

        const event = args.event[1];

        if (!event.tags.length || !event.tags[0].length || !event.tags[1].length) {
          return cbk();
        }
        const eTag = event.tags[0].find((t: string) => t === 'e');
        const eTagId = event.tags[0].find((t: string) => isHex(t));

        if (!eTag || !eTagId) {
          return cbk();
        }

        const pTag = event.tags[1].find((t: string) => t === 'p');
        const pTagId = event.tags[1].find((t: string) => isHex(t));

        if (!pTag || !pTagId) {
          return cbk();
        }

        const findReferenecEvent = data.events.find((e: any) => e.id === eTagId);

        if (!findReferenecEvent) {
          sendError({ error: 'Missing reference event', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

        return cbk(null, { tags: event.tags });
      },
    ],

    insertEvent: [
      'findTags',
      'readFile',
      ({ findTags, readFile }, cbk) => {
        const event = args.event[1];
        const data = readFile;

        const checkDuplicate = data.events.find((e: any) => e.id === event.id);

        if (!!checkDuplicate) {
          sendError({ error: 'Duplicate event id', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

        !!findTags.tags ? (event.tags = findTags.tags) : null;
        data.events.push(event);

        writeFile(defaults.data_path, stringify(data), err => {
          if (!!err) {
            sendError({ error: err.message, id: event.id, ws: args.ws });
            return cbk(new Error());
          }

          sendOk({ id: event.id, message: 'Event inserted', ws: args.ws });
          return cbk();
        });
      },
    ],
  });
};

export default insertEvent;
