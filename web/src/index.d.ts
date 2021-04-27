export interface SocketMessage {
  code: number;
}

export interface IncomingSocketChatMessage extends SocketMessage {
  message: Message;
}

export interface OutgoingSocketChatMessage extends SocketMessage {
  threadId: string;
  content: string;
}
