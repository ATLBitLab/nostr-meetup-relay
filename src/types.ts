export type InsertEventType = [
  'EVENT',
  {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: Array<Array<string>>;
    content: string;
    sig: string;
  }
];
