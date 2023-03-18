import * as dotenv from 'dotenv';

import { auto } from 'async';
import startWebsocket from './server/start_websocket';
dotenv.config();


const main = async () => {
  return await auto({
    startServer: async () => {
      console.log('Starting server');
      startWebsocket();
    },
  });
};

// This is the entry point of the program
main();
