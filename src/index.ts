import * as dotenv from 'dotenv';

import { auto } from 'async';
import { startWebsocket } from './server';

dotenv.config();
/** Main function
 *
 * @returns {Promise<void>}
 */

const main = async () => {
  return await auto({
    startServer: [
      async () => {
        startWebsocket();
      },
    ],
  });
};

// This is the entry point of the program
main();
