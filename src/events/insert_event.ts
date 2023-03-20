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

/** Inserts events to a json file
 * @param {InsertEventType} args.event
 * @param {WebSocket} args.ws
 *
 * @returns {Promise<void>}
 */
type Args = {
  event: InsertEventType;
  ws: WebSocket;
};
const insertEvent = async (args: Args) => {
  return await auto({
    // Check arguments
    validate: cbk => {
      const event = args.event[1];

      if (!event.group_id) {
        sendError({ error: 'Missing group id', ws: args.ws });
        return cbk(new Error());
      }

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

      if (!event.kind || event.kind !== defaults.event_kinds.insert) {
        sendError({ error: 'Missing/invalid event kind', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.tags || !isArray(event.tags)) {
        sendError({ error: 'Missing event tags', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      // When inserting a new event, content cannot be empty
      if (!event.content) {
        sendError({ error: 'Missing event content', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.sig) {
        sendError({ error: 'Missing event sig', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      // Verify the signature
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

    // Read the data file
    readFile: [
      'validate',
      ({}, cbk) => {
        readFile(defaults.data_path, 'utf8', (err, res) => {
          // Ignore errors, the file maybe not be present
          if (!!err) {
            sendError({ error: 'Invalid data file to insert event', ws: args.ws });
            return cbk(new Error());
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

    // Insert the event to the json file
    insertEvent: [
      'readFile',
      ({ readFile }, cbk) => {
        const event = args.event[1];
        const data = readFile;

        const checkDuplicate = data.events.find((e: any) => e.id === event.id);

        if (!!checkDuplicate) {
          sendError({ error: 'Duplicate event id', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

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
