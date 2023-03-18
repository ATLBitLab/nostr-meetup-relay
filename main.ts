import { auto } from 'async';
import startWebsocket from './server/start_websocket.ts';

const main = async () => {
  return await auto({
    startServer: () => {
      startWebsocket();
    },
  });
};

// This is the entry point of the program
main();
