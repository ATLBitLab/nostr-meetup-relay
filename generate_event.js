const crypto = require('crypto');
const tinysecp = require('tiny-secp256k1');

const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const unit8AsHex = n => Buffer.from(n).toString('hex');
const hashEvent = n => crypto.createHash('sha256').update(JSON.stringify(n)).digest();
const pubkey = '55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57';
const createdAt = Math.round(Date.now() / 1000);
const kind = 702;
const tags = [
  ['e', '759495876bcab17d55583facef1f0f74a1fc74501898e8e3d8e3ae7257216a61'],
  ['p', '55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57'],
];
// const tags = [];
const content = 'test content 34556';

const sampleJson = {
  content,
  kind,
  pubkey,
  tags,
  created_at: createdAt,
  id: '123',
  sig: '123',
};

const event = ['EVENT', sampleJson];
const eventId = [0, pubkey, createdAt, kind, tags, content];
const privateKey = '35f9a7cdda90ded86eb15279e0b1f51358c399b6dd08075eb7469f9b67454eab';

const hash = hashEvent(eventId);

sampleJson.id = unit8AsHex(hash);

sampleJson.sig = unit8AsHex(tinysecp.signSchnorr(hash, hexAsBuffer(privateKey)));

console.log(JSON.stringify(event));
