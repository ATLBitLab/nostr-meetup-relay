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
        const sampleJson = {
          id: '123',
          pubkey: '55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57',
          created_at: Math.round(Date.now() / 1000),
          kind: 700,
          tags: ['test', 'test2'],
          content: 'test content 234',
          sig: '123',
        };

        const event = ['EVENT', sampleJson];
        const privateKey = '35f9a7cdda90ded86eb15279e0b1f51358c399b6dd08075eb7469f9b67454eab';

        const hash: any = crypto.createHash('sha256').update(JSON.stringify(event)).digest();

        sampleJson.id = unit8AsHex(hash);

        sampleJson.sig = unit8AsHex(tinysecp.signSchnorr(hash, hexAsBuffer(privateKey)));

        console.log(JSON.stringify(event));

        startWebsocket();
      },
    ],
  });
};

// This is the entry point of the program
main();
