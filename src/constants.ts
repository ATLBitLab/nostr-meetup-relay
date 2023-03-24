import * as dotenv from 'dotenv';

import { cwd } from 'process';
import { join } from 'path';

dotenv.config();

export const defaults = {
  port: process.env.PORT || 8080,
  event_kinds: {
    group_insert: 600,
    group_edit: 601,
    group_join: 602,
    insert: 700,
    edit: 701,
    rsvp: 702,
  },
  data_path: join(cwd(), 'meetup.json'),
  message_types: ['CLOSE', 'EVENT', 'REQ'],
  publish_event_type: 'EVENT',
  close_event_type: 'CLOSE',
  req_event_type: 'REQ',
  default_data: { groups: [], events: [] },
};
