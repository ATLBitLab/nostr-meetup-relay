import { readFile, writeFile, writeFileSync } from 'fs';

import { InsertEventType } from '../types';
import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import sendError from './send_error';
import sendOk from './send_ok';
import { verifySchnorr } from 'tiny-secp256k1';

import { hexAsBuffer, isHex, isNumber, stringify, isArray, parse } from '../utils'

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
        sendError({ error: 'Missing group id to insert event', ws: args.ws });
        return cbk(new Error());
      }

      if (!event.id || !isHex(event.id)) {
        sendError({ error: 'Missing/invalid event id to insert event', ws: args.ws });
        return cbk(new Error());
      }

      if (!event.pubkey || !isHex(event.pubkey)) {
        sendError({ error: 'Missing creator pubkey to insert event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.created_at || !isNumber(event.created_at)) {
        sendError({ error: 'Missing/Invalid event created_at to insert event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.kind || event.kind !== defaults.event_kinds.insert) {
        sendError({ error: 'Missing/invalid event kind to insert event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.tags || !isArray(event.tags)) {
        sendError({ error: 'Missing event tags to insert event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      // When inserting a new event, content cannot be empty
      if (!event.content) {
        sendError({ error: 'Missing event content to insert event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.sig) {
        sendError({ error: 'Missing event sig to insert event', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      // Verify the signature
      try {
        if (!verifySchnorr(hexAsBuffer(event.id), hexAsBuffer(event.pubkey), hexAsBuffer(event.sig))) {
          sendError({ error: 'Invalid event sig to insert event', id: event.id, ws: args.ws });
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
            sendError({ error: 'Invalid data file to insert event', ws: args.ws });
            return cbk(new Error());
          }

          try {
            const data = JSON.parse(res);

            if (!data.events || !isArray(data.events)) {
              sendError({ error: 'Invalid data file', ws: args.ws });
              return cbk(new Error());
            }

            if (!data.groups || !isArray(data.groups)) {
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
        const findGroup = data.groups.find((g: any) => g.id === event.group_id);

        if (!findGroup) {
          sendError({ error: 'Group not found', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

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
