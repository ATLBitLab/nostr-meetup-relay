import { auto } from 'async';
import startWebsocket from './server/start_websocket';

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
