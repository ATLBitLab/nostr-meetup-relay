import * as dotenv from 'dotenv';

import { existsSync, readFile, writeFile } from 'fs';

import { auto } from 'async';
import { defaults } from './constants';
import { startWebsocket } from './server';

dotenv.config();

const stringify = (n: any) => JSON.stringify(n, null, 2);

/** Main function
 *
 * @returns {Promise<void>}
 */

const main = async () => {
  return await auto({
    // Insert db file on start
    insertDbFile: cbk => {
      const isExists = existsSync(defaults.data_path);

      if (!!isExists) {
        return cbk();
      }

      // If the db file doesn't exist, create it and insert default data.
      if (!isExists) {
        writeFile(defaults.data_path, stringify(defaults.default_data), err => {
          if (!!err) {
            return cbk(err);
          }

          return cbk();
        });
      }
    },
    // Start the server
    startServer: [
      'insertDbFile',
      async () => {
        startWebsocket();
      },
    ],
  });
};

// This is the entry point of the program
main();
