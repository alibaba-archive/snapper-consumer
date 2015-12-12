declare module 'snapper-consumer' {
  export = Consumer;
}

declare class Consumer {
  constructor(url: string, options: {
    token: string;
    query: string;
  });

  onopen: Function;
  onclose: Function;
  onerror(err: Error): any;
  onmessage(event: string): any;
  request(method: string, params: {
    [index: string]: any
  } | any[], callback: (err: Error, res: any) => any): Consumer;
  join(room: string): Consumer;
  _join(roomId: string, consumerId: string): any;
  _respond(event: string): void;
  connect(url: string, options: {
    token: string;
    query: string;
    [index: string]: any;
  }): Consumer;
  close(): void;
}
