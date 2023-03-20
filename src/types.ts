export type InsertEventType = [
  'EVENT',
  {
    id: string;
    group_id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: Array<Array<string>>;
    content: string;
    sig: string;
  }
];

export type InsertGroupType = [
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
