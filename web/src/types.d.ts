import { Message, Thread, ThreadSnippetFragment, UserSnippetFragment } from './generated/graphql';

// generic message types
export interface SocketMessage {
  code: number;
}
export interface SocketThreadMessage extends SocketMessage {
  threadId: string;
}

// chat message types
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

// call message types
export interface IncomingCreateCallMessage extends SocketThreadMessage {
  user: UserSnippetFragment;
  thread: ThreadSnippetFragment;
  callId: string;
}
export interface IncomingJoinCallMessage extends SocketMessage {
  callId: string;
  peerId: string;
  userId: string;
  user: UserSnippetFragment;
}
export interface IncomingCancelCallMessage extends SocketMessage {
  callId: string;
}
export interface IncomingStartCallMessage extends SocketMessage {
  callId: string;
  user: UserSnippetFragment;
  thread: ThreadSnippetFragment;
}
export interface IncomingKillCallMessage extends SocketMessage {
  callId: string;
}
