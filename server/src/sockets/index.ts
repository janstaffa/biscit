import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import http, { Server } from 'http';
import { createClient } from 'redis';
import { createQueryBuilder } from 'typeorm';
import WebSocket from 'ws';
import { browserOrigin } from '../constants';
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
const AUTH_CODE = 3004;

const HEARTBEAT_INTERVAL = 10000;
const ELAPSED_TIME = 30000;
const THROTTLE_LIMIT = 100;
const THROTTLE_INTERVAL = 500;

export const sockets = (server: Server) => {
  const wss = new WebSocket.Server({
    noServer: true,
    path: '/socket',
    maxPayload: 10 * 1024
  });

  server.on('upgrade', async (req: http.IncomingMessage, socket, head) => {
    const killConnection = () => {
      const payload = {
        code: AUTH_CODE,
        value: 'not authenticated'
      };
      socket.send(JSON.stringify(payload));
      socket.terminate();
    };

    let userId: string | undefined;

    try {
      if (req.headers.origin !== browserOrigin) {
        return killConnection();
      }

      const rawCookies = req.headers.cookie;

      if (!rawCookies) {
        return killConnection();
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
        return killConnection();
      }
    } catch (e) {
      return killConnection();
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, userId);
    });
  });

  wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage, userId: string) => {
    console.log('new connection, total connections:', Array.from(wss.clients.entries()).length);

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

    ws.on('close', () => {
      closeConnection();
    });

    const threads = await ThreadMembers.find({ where: { userId } });

    threads.forEach((thread) => {
      const { threadId } = thread;

      subClient.subscribe(threadId);
    });

    const payload = {
      code: AUTH_CODE,
      value: 'ok'
    };
    ws.send(JSON.stringify(payload));

    const handleMessage = async (data: string) => {
      const incoming = JSON.parse(data);
      const { code } = incoming;
      const senderUser = await User.findOne({ where: { id: userId } });
      if (!senderUser) {
        const payload = { code: ERROR_MESSAGE_CODE, message: "It seems like, you don't exist!" };
        ws.send(JSON.stringify(payload));
        closeConnection();
        return;
      }

      if (code === CHAT_MESSAGE_CODE) {
        const { content, threadId } = incoming as IncomingSocketChatMessage;

        const membership = await ThreadMembers.findOne({ where: { threadId, userId }, relations: ['thread'] });
        if (!membership) {
          const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' };
          ws.send(JSON.stringify(payload));
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
          const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' };
          ws.send(JSON.stringify(payload));
          return;
        }
        subClient.subscribe(threadId);
      } else if (code === LOAD_MESSAGES_CODE) {
        const { threadId, cursor, limit } = incoming as IncomingLoadMessagesMessage;

        const membership = await ThreadMembers.findOne({ where: { threadId, userId }, relations: ['thread'] });
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
          qb.andWhere('message."createdAt" < :createdAt', { createdAt: cursor });
        }
        qb.orderBy('message."createdAt"', 'DESC').limit(realLimitPlusOne);

        const messages = (await qb.getMany()) as Message[];

        const payload: OutgoingLoadMessagesMessage = {
          code: LOAD_MESSAGES_CODE,
          messages: messages.slice(0, realLimit),
          hasMore: messages.length === realLimitPlusOne
        };

        ws.send(JSON.stringify(payload));
      }
    };

    let sentMessages = 0;
    const delayedMessages: string[] = [];

    const throttle = setInterval(async () => {
      if (delayedMessages.length > 0) {
        await handleMessage(delayedMessages[0]);
        delayedMessages.shift();
      } else {
        if (sentMessages > 0) sentMessages--;
      }
    }, THROTTLE_INTERVAL);

    ws.on('message', async (data: string) => {
      if (sentMessages >= THROTTLE_LIMIT) {
        delayedMessages.push(data);

        const payload = {
          code: ERROR_MESSAGE_CODE,
          message: 'Throttle limit reached. Your messages will be sent shortly after.'
        };
        ws.send(JSON.stringify(payload));
        return;
      }
      sentMessages++;

      await handleMessage(data);
    });

    subClient.on('message', (channel, message) => {
      // const payload = JSON.parse(message) as SocketChatMessage;
      ws.send(message);
    });

    const heartbeat = setInterval(() => {
      if (ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED) {
        clearInterval(heartbeat);
        closeConnection();

        return;
      }
      ws.ping('ping', false, (err) => {
        if (err) {
          console.error(err);
          closeConnection();
          clearInterval(heartbeat);
        }
      });
    }, HEARTBEAT_INTERVAL);

    const elapsed = setTimeout(() => {
      closeConnection();
    }, ELAPSED_TIME);

    ws.on('pong', () => {
      clearTimeout(elapsed);
      elapsed.refresh();
    });
  });
};
