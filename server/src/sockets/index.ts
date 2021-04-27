import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { createClient } from 'redis';
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

const CHAT_MESSAGE_CODE = 3000;
const ERROR_MESSAGE_CODE = 3001;

const HEARTBEAT_INTERVAL = 10000;
const ELAPSED_TIME = 20000;

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
    };

    console.log('new connection, total connections:', Array.from(wss.clients.entries()).length);

    const rawCookies = req.headers.cookie;
    let userId: string | undefined;

    if (!rawCookies) {
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
      return closeConnection();
    }

    ws.on('close', () => closeConnection());

    // getting threads that user is in
    const threads = await ThreadMembers.find({ where: { userId } });

    threads.forEach((thread) => {
      const { threadId } = thread;

      subClient.subscribe(threadId);
    });

    // message transport handling
    ws.on('message', async (data: string) => {
      const incoming = JSON.parse(data) as IncomingSocketChatMessage;
      const { code, content, threadId } = incoming;

      if (code === CHAT_MESSAGE_CODE) {
        const senderUser = await User.findOne({ where: { id: userId } });
        if (!senderUser) {
          ws.send({ code: ERROR_MESSAGE_CODE, message: "It seems like, you don't exist!" });
          closeConnection();
          return;
        }

        const membership = await ThreadMembers.findOne({ where: { threadId, userId }, relations: ['thread'] });
        if (!membership) {
          ws.send({ code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' });
          closeConnection();
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
      }
    });

    subClient.on('message', (channel, message) => {
      const payload = JSON.parse(message) as SocketChatMessage;
      ws.send(JSON.stringify(payload));
    });

    const heartbeat = setInterval(() => {
      if (ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED) {
        closeConnection();
        clearInterval(heartbeat);

        return;
      }
      ws.ping('ping', false, (err) => {
        if (err) {
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
