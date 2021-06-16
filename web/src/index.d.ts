import { Message } from './generated/graphql';

export interface SocketMessage {
  code: number;
}
export interface SocketThreadMessage extends SocketMessage {
  threadId: string;
}
export interface IncomingSocketChatMessage extends SocketThreadMessage {
  message: Message;
}

export interface OutgoingSocketChatMessage extends SocketThreadMessage {
  content: string;
  replyingToId?: string;
  resendId?: string;
  media?: string[];
}

export interface TypingMessage extends SocketThreadMessage {
  username: string;
}

export interface IncomingDeleteMessage extends SocketThreadMessage {
  messageId: string;
}
export interface IncomingUpdateMessage extends SocketThreadMessage {
  messageId: string;
  newContent: string;
}

export interface attachment {
  id: string;
  name: string;
}

export interface IncomingThreadUpdateMessage extends SocketThreadMessage {
  updatedThread: Thread;
}

export interface OutgoingCreateCallMessage extends SocketThreadMessage {
  userId: string | undefined;
}

export interface IncomingCreateCallMessage extends SocketThreadMessage {
  user: User;
}
