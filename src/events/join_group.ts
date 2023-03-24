import { hexAsBuffer, isArray, isHex, isNumber, stringify } from '../utils';
import { readFile, writeFile, writeFileSync } from 'fs';

import { InsertEventType } from '../types';
import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import sendError from './send_error';
import sendOk from './send_ok';
import { verifySchnorr } from 'tiny-secp256k1';

/** Rsvp to an event
 * @param {InsertEventType} args.event
 * @param {WebSocket} args.ws
 *
 * @returns {Promise<void>}
 */
type Args = {
  event: InsertEventType;
  ws: WebSocket;
};
const joinGroup = async (args: Args) => {
  return await auto({
    // Check arguments
    validate: cbk => {
      const event = args.event[1];

      if (!event.id || !isHex(event.id)) {
        sendError({ error: 'Missing/invalid event id to Join group', ws: args.ws });
        return cbk(new Error());
      }

      if (!event.pubkey || !isHex(event.pubkey)) {
        sendError({ error: 'Missing creator pubkey to Join group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.created_at || !isNumber(event.created_at)) {
        sendError({ error: 'Missing/Invalid event created_at to Join group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.kind || event.kind !== defaults.event_kinds.group_join) {
        sendError({ error: 'Missing/invalid event kind to Join group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.tags || !isArray(event.tags)) {
        sendError({ error: 'Missing event tags to Join group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      if (!event.sig) {
        sendError({ error: 'Missing event sig to Join group', id: event.id, ws: args.ws });
        return cbk(new Error());
      }

      // Verify the signature
      try {
        if (!verifySchnorr(hexAsBuffer(event.id), hexAsBuffer(event.pubkey), hexAsBuffer(event.sig))) {
          sendError({ error: 'Invalid event sig to Join group', id: event.id, ws: args.ws });
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
          if (!!err) {
            sendError({ error: err.message, ws: args.ws });
            return cbk(new Error());
          }

          try {
            const data = JSON.parse(res);

            if (!data.groups || !isArray(data.groups)) {
              sendError({ error: 'Invalid data file to Join group', ws: args.ws });
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

    // Find p and e tags
    findTags: [
      'readFile',
      'validate',
      ({ readFile }, cbk) => {
        const data = readFile;
        const event = args.event[1];

        if (!data.groups.length) {
          sendError({ error: 'No data in database to Join group', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

        if (!event.tags.length || !event.tags[0].length || !event.tags[1].length) {
          sendError({ error: 'Missing event tags to Join group', id: event.id, ws: args.ws });
          return cbk(new Error());
        }
        const eTag = event.tags[0].find((t: string) => t === 'e');
        const eTagId = event.tags[0].find((t: string) => isHex(t));

        if (!eTag || !eTagId) {
          sendError({ error: 'Expected valid e tag to Join group', ws: args.ws });
          return cbk(new Error());
        }

        const pTag = event.tags[1].find((t: string) => t === 'p');
        const pTagId = event.tags[1].find((t: string) => isHex(t));

        if (!pTag || !pTagId) {
          sendError({ error: 'Expected valid p tag to Join group', ws: args.ws });
          return cbk(new Error());
        }

        // Check if a reference event exists for rsvp
        const findReferenecEvent = data.groups.find((e: any) => e.id === eTagId);

        if (!findReferenecEvent) {
          sendError({ error: 'Missing reference event to Join group', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

        return cbk(null, { tags: event.tags });
      },
    ],

    // Insert the event to the json file
    joinGroup: [
      'findTags',
      'readFile',
      ({ findTags, readFile }, cbk) => {
        const event = args.event[1];
        const data = readFile;

        // check if user already belongs to group?
        const checkDuplicate = data.groups.find((e: any) => e.id === event.id);

        if (!!checkDuplicate) {
          sendError({ error: 'Already joined this group', id: event.id, ws: args.ws });
          return cbk(new Error());
        }

        event.tags = findTags.tags;
        data.groups.push(event);

        writeFile(defaults.data_path, stringify(data), err => {
          if (!!err) {
            sendError({ error: err.message, id: event.id, ws: args.ws });
            return cbk(new Error());
          }

          sendOk({ id: event.id, message: 'Join group inserted', ws: args.ws });
          return cbk();
        });
      },
    ],
  });
};

export default joinGroup;
