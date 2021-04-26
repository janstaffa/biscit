import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { createClient } from 'redis';
import WebSocket from 'ws';
import { Session } from '../entities/Session';
import { ThreadMembers } from '../entities/ThreadMembers';

export interface SocketMessage {
  code: number;
  content: any;
}

export interface SocketChatMessage extends SocketMessage {
  content: string;
  threadId: string;
  senderId: string;
}

const CHAT_MESSAGE_CODE = 3000;

export const sockets = async (server: any) => {
  const wss = new WebSocket.Server({
    server,
    path: '/ws',
  });

  const HEARTBEAT_INTERVAL = 10000;
  wss.on('connection', async (ws, req) => {
    //redis clients setup
    const subClient = createClient({
      url: process.env.REDIS_URL,
    });
    subClient.on('error', function (error) {
      console.error(error);
    });

    const pubClient = createClient({
      url: process.env.REDIS_URL,
    });
    pubClient.on('error', function (error) {
      console.error(error);
    });

    const closeConnection = () => {
      ws.removeAllListeners();
      subClient.removeAllListeners();
      ws.terminate();
    };

    console.log(
      'new connection, total connections:',
      Array.from(wss.clients.entries()).length
    );

    const rawCookies = req.headers.cookie;
    let userId: string | undefined;
    if (!rawCookies) {
      return closeConnection();
    }
    const parsedCookies = cookie.parse(rawCookies);

    const unsignedCookies = cookieParser.signedCookies(
      parsedCookies,
      process.env.SESSION_SECRET as string
    );
    if (unsignedCookies.uid) {
      const session = await Session.findOne({
        where: { id: unsignedCookies.uid },
      });
      if (session) {
        userId = JSON.parse(session.data).userId;
      }
    }

    if (!userId) {
      return closeConnection();
    }

    ws.on('close', () => closeConnection());

    //getting threads that user is in
    const threads = await ThreadMembers.find({ where: { userId } });

    threads.forEach((thread) => {
      const { threadId } = thread;
      subClient.subscribe(threadId);
    });
    subClient.on('subscribe', (channel, count) =>
      console.log('user', userId, 'subscribed to cahnnel', channel)
    );
    console.log('USERID: ', userId, 'THREADS: ', threads);

    //message transport handling
    ws.on('message', (data: string) => {
      console.log('INCOMING: ', data);
      const message = JSON.parse(data) as SocketChatMessage;
      const { code } = message;

      if (code === CHAT_MESSAGE_CODE) {
        const { content, threadId, senderId } = {
          ...message,
          senderId: userId,
        } as SocketChatMessage;

        const payload: SocketChatMessage = {
          code: CHAT_MESSAGE_CODE,
          threadId,
          senderId,
          content,
        };
        pubClient.publish(threadId, JSON.stringify(payload));
      }
    });

    subClient.on('message', (channel, message) => {
      let messageObj = JSON.parse(message) as SocketChatMessage;

      const payload: SocketChatMessage = {
        code: CHAT_MESSAGE_CODE,
        threadId: channel,
        senderId: messageObj.senderId,
        content: messageObj.content,
      };
      console.log(payload);
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
  });
};
