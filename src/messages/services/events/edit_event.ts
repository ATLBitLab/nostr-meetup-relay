import { readFile, writeFile, writeFileSync } from 'fs';

import { InsertEventType } from '../../../types';
import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../../../constants';
import sendError from '../../send_error';
import sendOk from '../../send_ok';
import { verifySchnorr } from 'tiny-secp256k1';

const { isArray } = Array;
const hexAsBuffer = (hex: string) => Buffer.from(hex, 'hex');
const isHex = (n: string) => !!n && !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const stringify = (n: any) => JSON.stringify(n, null, 2);

/** Edit an existing event
 * @param {InsertEventType} args.event
 * @param {WebSocket} args.ws
 *
 * @returns {Promise<void>}
 */
type Args = {
  event: InsertEventType;
  ws: WebSocket;
};
const editEvent = async (args: Args) => {
  return await auto({
    // Check arguments
    validate: cbk => {
      const event = args.event[1];

      if (!event.id || !isHex(event.id)) {
        sendError({ error: 'Missing/invalid event id to edit event', ws: args.ws });
        return cbk(new Error());
      }

      if (!event.pubkey || !isHex(event.pubkey)) {
        sendError({ error: 'Missing creator pubkey to edit event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.created_at || Date.parse(String(event.created_at))) {
        sendError({ error: 'Missing/Invalid event created_at to edit event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.kind || event.kind !== defaults.event_kinds.edit) {
        sendError({ error: 'Missing/invalid event kind to edit event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.tags || !isArray(event.tags)) {
        sendError({ error: 'Missing event tags to edit event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.content) {
        sendError({ error: 'Missing event content to edit event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.sig) {
        sendError({ error: 'Missing event sig to edit event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      // Verify the signature
      try {
        if (!verifySchnorr(hexAsBuffer(event.id), hexAsBuffer(event.pubkey), hexAsBuffer(event.sig))) {
          sendError({ error: 'Invalid event sig to edit event', id: event.id, ws: args.ws });
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
      ({ }, cbk) => {
        readFile(defaults.data_path, 'utf8', (err, res) => {
          if (!!err) {
            sendError({ error: 'Data file not present to edit event', ws: args.ws });
            return cbk(new Error());
          }

          try {
            const data = JSON.parse(res);

            if (!data.events || !isArray(data.events)) {
              sendError({ error: 'Invalid data file to edit event', ws: args.ws });
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

    // Modify the old event
    modifyEvent: [
      'readFile',
      'validate',
      ({ readFile }, cbk) => {
        const data = readFile;

        if (!data.events.length) {
          sendError({ error: 'No events found in database to edit event', ws: args.ws });
          return cbk(new Error());
        }

        const event = args.event[1];

        if (!event.tags.length || !event.tags[0].length) {
          sendError({ error: 'Expected e tag in event to edit event', ws: args.ws });
          return cbk(new Error());
        }
        const eTag = event.tags[0].find((t: string) => t === 'e');
        const eTagId = event.tags[0].find((t: string) => isHex(t));

        if (!eTag || !eTagId) {
          sendError({ error: 'Expected e tag in event to edit event', ws: args.ws });
          return cbk(new Error());
        }

        // Find the reference event to modify
        const findReferenecEvent = data.events.find((e: any) => e.id === eTagId);

        if (!findReferenecEvent) {
          sendError({ error: 'Missing reference event to edit event', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

        // Make sure the pubkey of the new event matches the reference event
        if (findReferenecEvent.pubkey !== event.pubkey) {
          sendError({ error: 'Pubkey mismatch to edit event', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

        // Edit the content of the reference event and update data variable
        findReferenecEvent.content = event.content;

        writeFile(defaults.data_path, stringify(data), 'utf8', err => {
          if (!!err) {
            sendError({ error: err.message, id: event.id, ws: args.ws });
            return cbk(new Error());
          }

          sendOk({ id: event.id, message: 'event edited', ws: args.ws });
          return cbk();
        });
      },
    ],
  });
};

export default editEvent;
