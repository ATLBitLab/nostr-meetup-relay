import { readFile, writeFile, writeFileSync } from 'fs';

import { InsertGroupType } from '../types';
import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import sendError from './send_error';
import sendOk from './send_ok';
import { verifySchnorr } from 'tiny-secp256k1';

import { hexAsBuffer, isHex, isNumber, stringify, isArray } from '../utils'

/** Inserts groups to a json file
 * @param {InsertGroupType} args.event
 * @param {WebSocket} args.ws
 *
 * @returns {Promise<void>}
 */
type Args = {
  group: InsertGroupType;
  ws: WebSocket;
};
const insertGroup = async (args: Args) => {
  return await auto({
    // Check arguments
    validate: cbk => {
      const event = args.group[1];

      if (!event.id || !isHex(event.id)) {
        sendError({ error: 'Missing/invalid event id to insert group', ws: args.ws });
        return cbk(new Error());
      }

      if (!event.pubkey || !isHex(event.pubkey)) {
        sendError({ error: 'Missing creator pubkey to insert group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.created_at || !isNumber(event.created_at)) {
        sendError({ error: 'Missing/Invalid event created_at to insert group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.kind || event.kind !== defaults.event_kinds.group_insert) {
        sendError({ error: 'Missing/invalid event kind to insert group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.tags || !isArray(event.tags)) {
        sendError({ error: 'Missing event tags to insert group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      // When inserting a new group, content cannot be empty
      if (!event.content) {
        sendError({ error: 'Missing event content to insert group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.sig) {
        sendError({ error: 'Missing event sig to insert group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      // Verify the signature
      try {
        if (!verifySchnorr(hexAsBuffer(event.id), hexAsBuffer(event.pubkey), hexAsBuffer(event.sig))) {
          sendError({ error: 'Invalid event sig to insert group', id: event.id, ws: args.ws });
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
            sendError({ error: 'Invalid data file to insert group', ws: args.ws });
            return cbk(new Error());
          }

          try {
            const data = JSON.parse(res);

            if (!data.groups || !isArray(data.groups)) {
              sendError({ error: 'Invalid data file to insert groups', ws: args.ws });
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

    // Insert the group to the json file
    insertGroup: [
      'readFile',
      ({ readFile }, cbk) => {
        const event = args.group[1];
        const data = readFile;

        const checkDuplicate = data.groups.find((e: any) => e.id === event.id);

        if (!!checkDuplicate) {
          sendError({ error: 'Duplicate event id to insert group', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

        data.groups.push(event);

        writeFile(defaults.data_path, stringify(data), err => {
          if (!!err) {
            sendError({ error: err.message, id: event.id, ws: args.ws });
            return cbk(new Error());
          }

          sendOk({ id: event.id, message: 'Group inserted', ws: args.ws });
          return cbk();
        });
      },
    ],
  });
};

export default insertGroup;
