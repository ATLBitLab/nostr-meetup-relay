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

export type ReqType = [
  'REQ',
  string,
  {
    ids: Array<string>,
    authors: Array<string>,
    kinds: Array<number>,
    "#e": Array<string>,
    "#p": Array<string>,
    since: number,
    until: number,
    limit: number,
  }
]

export class Subscription {
  query: string;
  lastEvent: number;
  constructor(query?: string, lastEvent?: number) {
    this.query = query ?? '';
    this.lastEvent = lastEvent ?? 0;
  }
}