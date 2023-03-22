// create meetup group
[
  "EVENT",
  {
    content: "inserting group",
    kind: 600,
    pubkey: "55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57",
    tags: [
      ["e", "283fa620ebbd5ba3104243c88358f3f8cfe817bb95c7afcd6419c507dd592108"],
      ["p", "55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"]
    ],
    created_at: 1679347521,
    id: "5093aa072cf493e627909fff25ffbd76a92cde020f8b0f226465ef7b7de778e3",
    group_id: "456",
    sig:
      "ab1c048720a644439c04752a4b2079269966e157c7c888bbc87f50431065c28f48eac87f7a5db22621939d6ed3861699a3e6dbe9884e9dbc8663a85ab8325a87"
  }
];
// create meeting for meetup group 456
[
  "EVENT",
  {
    content: "inserting event to group_id 456",
    kind: 700,
    pubkey: "55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57",
    tags: [
      ["e", "283fa620ebbd5ba3104243c88358f3f8cfe817bb95c7afcd6419c507dd592108"],
      ["p", "55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"]
    ],
    created_at: 1679398265,
    id: "cf91474493f78bed64a5cbe68dd340c66412bd6ff890bc876692c6ad590bc6c0",
    group_id: "123",
    sig:
      "fd1cfb9ac511145488fae86c8684a519834a960a0f4b6beb17c6378495d91dc33f55db5f2ada25e4d5e96acbaa487cd0257f5270464bd5b9bdad7c952047952b"
  }
];
[
  "REQ",
  "01P5BzG7tf29DG3rJaTZKqwBam0q0KygHrYC4g6vBm22ZOU8k0DTvIgtb9NABULx",
  {
    ids: ["aca7b677c0b4a7f459fc94b809bea71f7a800a2b54f5c1c92d92ffa0d7b18a9f"],
    authors: [
      "55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"
    ],
    kinds: [600],
    "#e": ["283fa620ebbd5ba3104243c88358f3f8cfe817bb95c7afcd6419c507dd592108"],
    "#p": ["55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"],
    since: 1679343740,
    until: 1679350000
  }
];
// subscribe to new meetings created by pubkey 55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57
[
  "REQ",
  "01P5BzG7tf29DG3rJaTZKqwBam0q0KygHrYC4g6vBm22ZOU8k0DTvIgtb9NABULx",
  {
    ids: ["aca7b677c0b4a7f459fc94b809bea71f7a800a2b54f5c1c92d92ffa0d7b18a9f"],
    authors: [
      "55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"
    ],
    kinds: [600],
    "#e": ["283fa620ebbd5ba3104243c88358f3f8cfe817bb95c7afcd6419c507dd592108"],
    "#p": ["55a3fd367611e5161719388e9ca8d0eea5fea62374340bf98c85c3c0fcd42a57"],
    since: 1679343740,
    until: 1679350000,
    limit: 1
  }
];
