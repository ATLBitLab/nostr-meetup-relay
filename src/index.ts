import * as dotenv from 'dotenv';
import * as tinysecp from 'tiny-secp256k1';

import { auto } from 'async';
import crypto from 'crypto';
import { startWebsocket } from './server';

const hexAsBuffer = (hex: string) => Buffer.from(hex, 'hex');
const unit8AsHex = (n: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>) => Buffer.from(n).toString('hex');

dotenv.config();

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
