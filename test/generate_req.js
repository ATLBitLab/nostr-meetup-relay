const crypto = require("crypto");
const ALPHA_NUM =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const randAlphaNumSecure = n => {
  let out = [];
  for (const _ of Array(n).keys())
    out.push(ALPHA_NUM[crypto.randomBytes(1).readUInt8() % ALPHA_NUM.length]);
  return out.join("");
};
/** 
  seed: sing open arrest hidden drift penalty roast idea system address useless chronic globe draw favorite mind joy latin maximum chuckle thing holiday crane round
  public: d4b1fd113c49ab05b53c42ee81d782a0aba37cb3ac15645730aafc30b44923d6
  private key: 81542986558ffa0ed7a0291f83d1cf98b2763f622d57e9d7513e9d767beeee41
*/
const ids = [
  "aca7b677c0b4a7f459fc94b809bea71f7a800a2b54f5c1c92d92ffa0d7b18a9f"
];
const authors = [
  "55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"
];
const kinds = [600];
const e = ["283fa620ebbd5ba3104243c88358f3f8cfe817bb95c7afcd6419c507dd592108"];
const p = ["55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"];
const since = 1679340000;
const until = 1679350000;
const limit = 1;
const subscriptionId = randAlphaNumSecure(64);
const filters = {
  ids,
  authors,
  kinds,
  "#e": e,
  "#p": p,
  since,
  until,
  limit
};

const requestSubscribe = ["REQ", subscriptionId, filters];
console.log(JSON.stringify(requestSubscribe));

/**
  [
    "REQ",
    "ihHXEnnpskTfRbaGXHIcW0TwY8RSdaUQ4d9LmNBTo5TFnh8fnwBeu0Y24LQVLU28",
    {
      "ids":["aca7b677c0b4a7f459fc94b809bea71f7a800a2b54f5c1c92d92ffa0d7b18a9f"],
      "authors": ["55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"],
      "kinds": [600],
      "#e": ["283fa620ebbd5ba3104243c88358f3f8cfe817bb95c7afcd6419c507dd592108"],
      "#p": ["55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"],
      "since": 1679343740,
      "until": 1679350000,
      "limit": 1
    }
  ]
*/
