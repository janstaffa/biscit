import { RedisClient } from 'redis';
import WebSocket from 'ws';
import {
  CHAT_MESSAGE_CODE,
  CHAT_TYPING_CODE,
  closeConnection,
  ERROR_MESSAGE_CODE,
  IncomingSocketChatMessage,
  JOIN_THREAD_CODE,
  SocketChatMessage,
  SocketThreadMessage
} from '.';
import { Message } from '../entities/Message';
import { Thread } from '../entities/Thread';
import { ThreadMembers } from '../entities/ThreadMembers';
import { User } from '../entities/User';
import { getId } from '../utils/generateId';

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
    try {
      const messageId = await getId(Message, 'id');
      const newMessage = await Message.create({
        id: messageId,
        content,
        threadId,
        userId: user.id,
        edited: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const membership = await ThreadMembers.findOne({ where: { userId: user.id, threadId } });
      if (!membership) {
        const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' };
        ws.send(JSON.stringify(payload));
        return;
      }
      newMessage.save();

      await Thread.update({ id: threadId }, { lastActivity: new Date() });

      const payload: SocketChatMessage = {
        threadId,
        code: CHAT_MESSAGE_CODE,
        message: {
          ...newMessage,
          user: senderUser
        } as Message
      };

      pubClient.publish(threadId, JSON.stringify(payload));
    } catch (e) {
      console.error(e);
    }
  } else if (code === JOIN_THREAD_CODE) {
    const { threadId } = incoming as SocketThreadMessage;

    try {
      const membership = await ThreadMembers.update({ threadId, userId: user.id }, { unread: 0 });
      if (!membership.affected || membership.affected !== 1) {
        const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' };
        ws.send(JSON.stringify(payload));
        return;
      }
      subClient.subscribe(threadId);
    } catch (e) {
      console.error(e);
    }
  } else if (code === CHAT_TYPING_CODE) {
    const { threadId } = incoming as SocketThreadMessage;
    try {
      const payload: SocketThreadMessage & { username: string } = {
        code: CHAT_TYPING_CODE,
        threadId,
        username: user.username
      };

      pubClient.publish(threadId, JSON.stringify(payload));
    } catch (e) {
      console.error(e);
    }
  }
};
