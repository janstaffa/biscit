export interface SocketMessage {
  code: number;
}
export interface SocketThreadMessage extends SocketMessage {
  threadId: string;
}
export interface IncomingSocketChatMessage extends SocketMessage {
  message: Message;
}

export interface OutgoingSocketChatMessage extends SocketThreadMessage {
  content: string;
}

export interface OutgoingLoadMessagesMessage extends SocketThreadMessage {
  cursor: string | null;
  limit: number;
}

export interface IncomingLoadMessagesMessage extends SocketMessage {
  messages: Message[] | [];
  hasMore: boolean;
}

export interface TypingMessage extends SocketThreadMessage {
  username: string;
}
