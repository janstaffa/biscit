import { RedisClient } from 'redis';
import { createQueryBuilder } from 'typeorm';
import WebSocket from 'ws';
import {
  CHAT_MESSAGE_CODE,
  CHAT_TYPING_CODE,
  closeConnection,
  ERROR_MESSAGE_CODE,
  IncomingLoadMessagesMessage,
  IncomingSocketChatMessage,
  JOIN_THREAD_CODE,
  LOAD_MESSAGES_CODE,
  OutgoingLoadMessagesMessage,
  SocketChatMessage,
  SocketThreadMessage
} from '.';
import { Message } from '../entities/Message';
import { ThreadMembers } from '../entities/ThreadMembers';
import { User } from '../entities/User';

export const handleMessage = async (
  data: string,
  ws: WebSocket,
  subClient: RedisClient,
  pubClient: RedisClient,
  user: User
) => {
  const incoming = JSON.parse(data);
  const { code } = incoming;
  const senderUser = await User.findOne({ where: { id: user.id } });
  if (!senderUser) {
    const payload = { code: ERROR_MESSAGE_CODE, message: "It seems like, you don't exist!" };
    ws.send(JSON.stringify(payload));
    closeConnection(ws);
    subClient.removeAllListeners();

    return;
  }

  if (code === CHAT_MESSAGE_CODE) {
    const { content, threadId } = incoming as IncomingSocketChatMessage;

    const membership = await ThreadMembers.findOne({ where: { threadId, userId: user.id }, relations: ['thread'] });
    if (!membership) {
      const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' };
      ws.send(JSON.stringify(payload));
      return;
    }

    const newMessage = await Message.create({
      content,
      threadId,
      userId: user.id
    }).save();

    const payload: SocketChatMessage = {
      threadId,
      code: CHAT_MESSAGE_CODE,
      message: {
        ...newMessage,
        user: senderUser
      } as Message
    };

    pubClient.publish(threadId, JSON.stringify(payload));
  } else if (code === JOIN_THREAD_CODE) {
    const { threadId } = incoming as SocketThreadMessage;

    const membership = await ThreadMembers.findOne({ where: { threadId, userId: user.id }, relations: ['thread'] });
    if (!membership) {
      const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' };
      ws.send(JSON.stringify(payload));
      return;
    }
    subClient.subscribe(threadId);
  } else if (code === LOAD_MESSAGES_CODE) {
    const { threadId, cursor, limit } = incoming as IncomingLoadMessagesMessage;

    const membership = await ThreadMembers.findOne({ where: { threadId, userId: user.id }, relations: ['thread'] });
    if (!membership) {
      const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' };
      ws.send(JSON.stringify(payload));
      return;
    }

    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const qb = createQueryBuilder(Message, 'message')
      .leftJoinAndSelect('message.user', 'user')
      .where('message."threadId" = :threadId', { threadId: threadId });

    if (cursor) {
      qb.andWhere('message."createdAt" < :cursor', { cursor: new Date(cursor) });
    }
    qb.orderBy('message."createdAt"', 'DESC').limit(realLimitPlusOne);

    const messages = (await qb.getMany()) as Message[];

    const payload: OutgoingLoadMessagesMessage = {
      threadId,
      code: LOAD_MESSAGES_CODE,
      messages: messages.slice(0, realLimit).reverse(),
      hasMore: messages.length === realLimitPlusOne
    };

    ws.send(JSON.stringify(payload));
  } else if (code === CHAT_TYPING_CODE) {
    const { threadId } = incoming as SocketThreadMessage;
    const payload: SocketThreadMessage & { username: string } = {
      code: CHAT_TYPING_CODE,
      threadId,
      username: user.username
    };

    pubClient.publish(threadId, JSON.stringify(payload));
  }
};
