import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import http, { Server } from 'http';
import * as net from 'net';
import { createClient, RedisClient } from 'redis';
import WebSocket from 'ws';
import { browserOrigin } from '../constants';
import { Message } from '../entities/Message';
import { Session } from '../entities/Session';
import { Thread } from '../entities/Thread';
import { ThreadMembers } from '../entities/ThreadMembers';
import { User } from '../entities/User';
import { handleMessage } from './handleMessage';

export interface SocketMessage {
  code: number;
  // token: string;
}
export interface SocketThreadMessage extends SocketMessage {
  threadId: string;
}
export interface SocketChatMessage extends SocketThreadMessage {
  message: Message;
}

export interface IncomingSocketChatMessage extends SocketThreadMessage {
  content: string;
  replyingToId?: string;
  resendId?: string;
  media?: string[];
}

export interface IncomingLoadMessagesMessage extends SocketThreadMessage {
  cursor: string | null;
  limit: number;
}
export interface OutgoingLoadMessagesMessage extends SocketThreadMessage {
  messages: Message[] | [];
  hasMore: boolean;
}

export interface ThreadUpdateMessage extends SocketThreadMessage {
  updatedThread: Thread;
}

export const LOAD_MESSAGES_CODE = 3003;
export const JOIN_THREAD_CODE = 3002;
export const CHAT_MESSAGE_CODE = 3000;
export const CHAT_TYPING_CODE = 3006;
export const UPDATE_MESSAGE_CODE = 3008;
export const DELETE_MESSAGE_CODE = 3007;
export const ERROR_MESSAGE_CODE = 3001;
export const AUTH_CODE = 3004;
export const READY_CODE = 3005;
export const THREAD_CHANGE_CODE = 3009;

const HEARTBEAT_INTERVAL = 10000;
const ELAPSED_TIME = 30000;
const THROTTLE_LIMIT = 200;
const THROTTLE_INTERVAL = 500;

export const closeConnection = (ws: WebSocket) => {
  ws.removeAllListeners();
  ws.terminate();
};

export const socketController = (server: Server) => {
  const wss = new WebSocket.Server({
    noServer: true,
    path: '/socket',
    maxPayload: 10 * 1024
  });

  server.on('upgrade', async (req: http.IncomingMessage, socket: net.Socket, head) => {
    let userId: string | undefined;

    try {
      if (req.headers.origin !== browserOrigin) {
        return socket.destroy();
      }

      const rawCookies = req.headers.cookie;

      if (!rawCookies) {
        return socket.destroy();
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
        return socket.destroy();
      }
    } catch (e) {
      return socket.destroy();
    }
    const user = await User.findOne({ where: { id: userId } });
    if (!user) return socket.destroy();

    wss.handleUpgrade(req, socket, head, (ws) => {
      const payload = {
        code: AUTH_CODE,
        value: 'authenticated'
      };
      ws.send(JSON.stringify(payload));

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

      wss.emit('connection', ws, req, user, subClient, pubClient);
    });
  });

  wss.on(
    'connection',
    async (ws: WebSocket, req: http.IncomingMessage, user: User, subClient: RedisClient, pubClient: RedisClient) => {
      console.log('new connection, total connections:', Array.from(wss.clients.entries()).length);

      const heartbeat = setInterval(() => {
        if (ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED) {
          clearInterval(heartbeat);
          closeConnectionAndClear();

          return;
        }
        ws.ping('ping', false, (err) => {
          if (err) {
            console.error(err);
            closeConnectionAndClear();
            clearInterval(heartbeat);
          }
        });
      }, HEARTBEAT_INTERVAL);

      const elapsed = setTimeout(() => {
        closeConnectionAndClear();
      }, ELAPSED_TIME);

      const closeConnectionAndClear = () => {
        console.log('connection closed');
        closeConnection(ws);
        subClient.removeAllListeners();
        subClient.unsubscribe();
        clearTimeout(elapsed);
        clearInterval(heartbeat);
      };

      let sentMessages = 0;
      const delayedMessages: string[] = [];

      const throttle = setInterval(async () => {
        if (delayedMessages.length > 0) {
          await handleMessage(delayedMessages[0], ws, subClient, pubClient, user);
          delayedMessages.shift();
        } else {
          if (sentMessages > 0) sentMessages -= 3;
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

        await handleMessage(data, ws, subClient, pubClient, user);
      });

      ws.on('pong', () => {
        clearTimeout(elapsed);
        elapsed.refresh();
      });

      ws.on('close', () => {
        closeConnectionAndClear();
      });

      try {
        const threads = await ThreadMembers.find({ where: { userId: user.id } });

        threads.map((thread) => {
          const { threadId } = thread;
          subClient.subscribe(threadId);
        });
      } catch (e) {
        console.error(e);
      }

      subClient.on('message', async (channel, message) => {
        const parsed = JSON.parse(message);
        if (parsed.code === 3000) {
          const { message, threadId } = parsed as SocketChatMessage;
          if (message.userId !== user.id) {
            const latestUser = await User.findOne({ where: { id: user.id } });
            if (latestUser && latestUser.setAsUnread) {
              await ThreadMembers.update({ userId: user.id, threadId }, { unread: () => 'unread + 1' });
            }
          }
        }
        ws.send(message);
      });
    }
  );
};
