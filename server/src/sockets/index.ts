import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { createClient } from 'redis';
import { createQueryBuilder } from 'typeorm';
import WebSocket from 'ws';
import { Message } from '../entities/Message';
import { Session } from '../entities/Session';
import { ThreadMembers } from '../entities/ThreadMembers';
import { User } from '../entities/User';

export interface SocketMessage {
  code: number;
}

export interface SocketChatMessage extends SocketMessage {
  message: Message;
}

export interface IncomingSocketChatMessage extends SocketMessage {
  threadId: string;
  content: string;
}

export interface IncomingJoinThreadMessage extends SocketMessage {
  threadId: string;
}

export interface IncomingLoadMessagesMessage extends SocketMessage {
  threadId: string;
  cursor: string | null;
  limit: number;
}
export interface OutgoingLoadMessagesMessage extends SocketMessage {
  messages: Message[] | [];
  hasMore: boolean;
}

const LOAD_MESSAGES_CODE = 3003;
const JOIN_THREAD_CODE = 3002;
const CHAT_MESSAGE_CODE = 3000;
const ERROR_MESSAGE_CODE = 3001;

const HEARTBEAT_INTERVAL = 10000;
const ELAPSED_TIME = 30000;

export const sockets = (server: any) => {
  const wss = new WebSocket.Server({
    server,
    path: '/ws'
  });

  wss.on('connection', async (ws, req) => {
    // redis clients setup
    const subClient = createClient({
      url: process.env.REDIS_URL
    });

    subClient.on('error', (error) => {
      console.error(error);
    });

    const pubClient = createClient({
      url: process.env.REDIS_URL
    });

    pubClient.on('error', (error) => {
      console.error(error);
    });

    const closeConnection = () => {
      ws.removeAllListeners();
      subClient.removeAllListeners();
      ws.terminate();
      clearTimeout(elapsed);
      clearInterval(heartbeat);
    };

    console.log('new connection, total connections:', Array.from(wss.clients.entries()).length);

    const rawCookies = req.headers.cookie;
    let userId: string | undefined;

    if (!rawCookies) {
      console.log('closing... 1');
      return closeConnection();
    }
    const parsedCookies = cookie.parse(rawCookies);

    const unsignedCookies = cookieParser.signedCookies(parsedCookies, process.env.SESSION_SECRET as string);

    if (unsignedCookies.uid) {
      const session = await Session.findOne({
        where: { id: unsignedCookies.uid }
      });

      if (session) {
        userId = JSON.parse(session.data).userId;
      }
    }

    if (!userId) {
      console.log('closing... 2');

      return closeConnection();
    }

    ws.on('close', () => {
      console.log('closing 2.5');
      closeConnection();
    });

    // getting threads that user is in
    const threads = await ThreadMembers.find({ where: { userId } });

    threads.forEach((thread) => {
      const { threadId } = thread;

      subClient.subscribe(threadId);
    });

    // message transport handling
    ws.on('message', async (data: string) => {
      // console.log('new message');
      const incoming = JSON.parse(data);
      const { code } = incoming;

      const senderUser = await User.findOne({ where: { id: userId } });
      if (!senderUser) {
        ws.send({ code: ERROR_MESSAGE_CODE, message: "It seems like, you don't exist!" });
        console.log('closing... 3');
        closeConnection();
        return;
      }

      if (code === CHAT_MESSAGE_CODE) {
        const { content, threadId } = incoming as IncomingSocketChatMessage;

        const membership = await ThreadMembers.findOne({ where: { threadId, userId }, relations: ['thread'] });
        if (!membership) {
          ws.send({ code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' });
          return;
        }

        const newMessage = await Message.create({
          content,
          threadId,
          userId
        }).save();

        const payload = {
          code: CHAT_MESSAGE_CODE,
          message: {
            ...newMessage,
            user: senderUser
          } as Message
        };

        pubClient.publish(threadId, JSON.stringify(payload));
      } else if (code === JOIN_THREAD_CODE) {
        const { threadId } = incoming as IncomingJoinThreadMessage;

        const membership = await ThreadMembers.findOne({ where: { threadId, userId }, relations: ['thread'] });
        if (!membership) {
          ws.send({ code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' });
          return;
        }
        subClient.subscribe(threadId);
      } else if (code === LOAD_MESSAGES_CODE) {
        const { threadId, cursor, limit } = incoming as IncomingLoadMessagesMessage;

        const membership = await ThreadMembers.findOne({ where: { threadId, userId }, relations: ['thread'] });
        if (!membership) {
          ws.send({ code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' });
          return;
        }

        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;

        const qb = createQueryBuilder(Message, 'message')
          .leftJoinAndSelect('message.user', 'user')
          .where('message."threadId" = :threadId', { threadId: threadId });

        if (cursor) {
          qb.andWhere('message."createdAt" < :createdAt', { createdAt: cursor });
        }
        qb.orderBy('message."createdAt"', 'DESC').limit(realLimitPlusOne);

        const messages = (await qb.getMany()) as Message[];

        const payload: OutgoingLoadMessagesMessage = {
          code: LOAD_MESSAGES_CODE,
          messages: messages.slice(0, realLimit),
          hasMore: messages.length === realLimitPlusOne
        };
        console.log('dataa', data);

        ws.send(JSON.stringify(payload));
      }
    });

    subClient.on('message', (channel, message) => {
      // const payload = JSON.parse(message) as SocketChatMessage;
      ws.send(message);
    });

    const heartbeat = setInterval(() => {
      if (ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED) {
        console.log('closing... 4');
        clearInterval(heartbeat);
        closeConnection();

        return;
      }
      ws.ping('ping', false, (err) => {
        if (err) {
          console.error(err);
          console.log('closing... 5');
          closeConnection();
          clearInterval(heartbeat);
        }
      });
    }, HEARTBEAT_INTERVAL);

    const elapsed = setTimeout(() => {
      console.log('closing... 6');
      closeConnection();
    }, ELAPSED_TIME);

    ws.on('pong', () => {
      clearTimeout(elapsed);
      console.log('ponged');
      elapsed.refresh();
    });
  });
};
