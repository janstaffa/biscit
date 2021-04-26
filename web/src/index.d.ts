export interface SocketMessage {
  code: number;
  content: any;
}

export interface SocketChatMessage extends SocketMessage {
  content: string;
  threadId: string;
  senderId: string;
}
