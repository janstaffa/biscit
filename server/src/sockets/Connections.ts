import WebSocket from 'ws';

interface Sockets {
  [userId: string]: WebSocket;
}
export class Connections {
  sockets: Sockets = {};

  constructor() {
    // console.log('NEW CLASS');
  }
  getSockets(): Sockets {
    return this.sockets;
  }
  getSocket(userId: string): WebSocket | undefined {
    if (!userId || typeof userId !== 'string') return;
    return this.sockets[userId];
  }
  addSocket(userId: string, ws: WebSocket): boolean {
    if (!userId || typeof userId !== 'string' || !ws) return false;
    this.sockets[userId] = ws;
    return true;
  }
  removeSocket(userId: string): boolean {
    if (!userId) return false;
    if (!this.sockets[userId]) return false;
    delete this.sockets[userId];
    return true;
  }
}
