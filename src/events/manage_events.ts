import WebSocket from 'ws';
import { auto } from 'async';
import { defaults } from '../constants';
import editEvent from './edit_event';
import insertEvent from './insert_event';
import rsvpEvent from './rsvp_event';
import sendError from './send_error';

const { parse } = JSON;
const { isArray } = Array;

/** Manage events
 * @param {string} args.event
 * @param {WebSocket} args.ws
 *
 * @returns {Promise<void>}
 */
type Args = {
  event: string;
  ws: WebSocket;
};
const manageEvents = async (args: Args) => {
  return await auto({
    // Check arguments
    validate: cbk => {
      try {
        const result = parse(args.event);

        if (!isArray(result) || result.length !== 2) {
          sendError({ error: 'Invalid event', ws: args.ws });
          return cbk(new Error());
        }

        if (!defaults.event_types.includes(result[0])) {
          sendError({ error: 'Invalid event type', ws: args.ws });
          return cbk(new Error());
        }

        return cbk();
      } catch (error: any) {
        sendError({ error: error.message, ws: args.ws });
        return cbk(new Error());
      }
    },

    // Return the parsed event
    parseEvent: [
      'validate',
      ({}, cbk) => {
        return cbk(null, { event: parse(args.event) });
      },
    ],

    // Insert the event
    insertEvent: [
      'parseEvent',
      async ({ parseEvent }) => {
        // Exit early when the event is not an insert event
        try {
          if (
            parseEvent.event[0] !== defaults.publish_event_type ||
            parseEvent.event[1].kind !== defaults.event_kinds.insert
          ) {
            return;
          }

          console.log(parseEvent.event[1].kind);

          await insertEvent({ event: parseEvent.event, ws: args.ws });
          return;
        } catch (error: any) {
          return;
        }
      },
    ],

    // Edit an event
    editEvent: [
      'parseEvent',
      async ({ parseEvent }) => {
        // Exit early when the event is not an edit event
        try {
          if (
            parseEvent.event[0] !== defaults.publish_event_type ||
            parseEvent.event[1].kind !== defaults.event_kinds.edit
          ) {
            return;
          }

          console.log(parseEvent.event[1].kind);

          await editEvent({ event: parseEvent.event, ws: args.ws });
          return;
        } catch (error: any) {
          return;
        }
      },
    ],

    // Rsvp to an event
    rsvpEvent: [
      'parseEvent',
      async ({ parseEvent }) => {
        // Exit early when the event is not an rsvp event
        try {
          if (
            parseEvent.event[0] !== defaults.publish_event_type ||
            parseEvent.event[1].kind !== defaults.event_kinds.rsvp
          ) {
            return;
          }

          await rsvpEvent({ event: parseEvent.event, ws: args.ws });
          return;
        } catch (error: any) {
          return;
        }
      },
    ],
  });
};

export default manageEvents;
