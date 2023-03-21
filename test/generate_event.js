const crypto = require("crypto");
const tinysecp = require("tiny-secp256k1");

const hexAsBuffer = hex => Buffer.from(hex, "hex");
const unit8AsHex = n => Buffer.from(n).toString("hex");
const hashEvent = n =>
  crypto.createHash("sha256").update(JSON.stringify(n)).digest();
const pubkey =
  "55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57";
const createdAt = Math.round(Date.now() / 1000);
const kind = 700; // change this based on event type (600, 601, 700, 701, 702)
const tags = [
  ["e", "283fa620ebbd5ba3104243c88358f3f8cfe817bb95c7afcd6419c507dd592108"],
  ["p", "55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"]
];

const content = "inserting event to group_id 456"; // change this based on what you're doing;

const sampleJson = {
  content,
  kind,
  pubkey,
  tags,
  created_at: createdAt,
  id: "012", // change this at random
  group_id: "123", // change this to something random if creating new group or to a specific group_id if creating a new meetup for a specific group
  sig: "012" // change this at random
};

const event = ["EVENT", sampleJson];
const eventId = [0, pubkey, createdAt, kind, tags, content];
const privateKey =
  "35f9a7cdda90ded86eb15279e0b1f51358c399b6dd08075eb7469f9b67454eab";

const hash = hashEvent(eventId);

sampleJson.id = unit8AsHex(hash);

sampleJson.sig = unit8AsHex(
  tinysecp.signSchnorr(hash, hexAsBuffer(privateKey))
);

console.log(JSON.stringify(event));
