const crypto = require('crypto');
const tinysecp = require('tiny-secp256k1');

const hexAsBuffer = hex => Buffer.from(hex, 'hex');
const unit8AsHex = n => Buffer.from(n).toString('hex');
const hashEvent = n => crypto.createHash('sha256').update(JSON.stringify(n)).digest();
const pubkey = '55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57';
const createdAt = Math.round(Date.now() / 1000);
const kind = 600;
const tags = [
  ['e', '283fa620ebbd5ba3104243c88358f3f8cfe817bb95c7afcd6419c507dd592108'],
  ['p', '55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57'],
];
// const tags = [['e', '283fa620ebbd5ba3104243c88358f3f8cfe817bb95c7afcd6419c507dd592108']];
// const tags = [];
const content = 'inserting group';

const sampleJson = {
  content,
  kind,
  pubkey,
  tags,
  created_at: createdAt,
  id: '123',
  group_id: '123',
  sig: '123',
};

const event = ['EVENT', sampleJson];
const eventId = [0, pubkey, createdAt, kind, tags, content];
const privateKey = '35f9a7cdda90ded86eb15279e0b1f51358c399b6dd08075eb7469f9b67454eab';

const hash = hashEvent(eventId);

sampleJson.id = unit8AsHex(hash);

sampleJson.sig = unit8AsHex(tinysecp.signSchnorr(hash, hexAsBuffer(privateKey)));

console.log(JSON.stringify(event));
