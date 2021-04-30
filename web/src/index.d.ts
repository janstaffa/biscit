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

export interface OutgoingLoadMessagesMessage extends SocketMessage {
  threadId: string;
  threadId: string;
  cursor: string | null;
  limit: number;
}

export interface IncomingLoadMessagesMessage extends SocketMessage {
  messages: Message[] | [];
  hasMore: boolean;
}
