export interface RequestObject {
  id: number;
  jsonrpc: string;
  method: 'publish' | 'notification' | 'success' | 'error' | 'invalid';
  params: string[];
}

export interface RequestEvent {
  id: number;
  type: 'request' | 'invalid' | 'notification' | 'success' | 'error';
  data: RequestObject;
}

export default class Consumer {
  constructor(url?: string, options?: {
    token: string;
    query: string;
  });

  onopen: Function;
  onclose: Function;
  onerror(err: Error): void;
  onmessage(event: RequestEvent): void;
  request(method: string, params: {
    [index: string]: any
  } | any[], callback: (err: Error, res: any) => any): Consumer;
  join(room?: string): Consumer;
  getToken(): string;
  _join(roomId: string, consumerId: string): any;
  _respond(event: string): void;
  connect(url: string, options?: {
    token: string;
    path?: string;
    query?: string;
    [index: string]: any;
  }): Consumer;
  close(): void;
}
