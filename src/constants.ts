import * as dotenv from 'dotenv';

import { InsertEventType } from './types';
import { cwd } from 'process';
import { join } from 'path';

dotenv.config();

export const defaults = {
  port: process.env.PORT || 8080,
  event_kinds: {
    insert: 700,
    edit: 701,
    rsvp: 702,
  },
  data_path: join(cwd(), 'meetup.json'),
  event_types: ['CLOSE', 'EVENT', 'REQ'],
  publish_event_type: 'EVENT',
  close_event_type: 'CLOSE',
  req_event_type: 'REQ',
};
