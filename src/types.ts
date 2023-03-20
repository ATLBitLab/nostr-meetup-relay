export type InsertEventType = [
  'EVENT',
  {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: [[]];
    content: string;
    sig: string;
  }
];
