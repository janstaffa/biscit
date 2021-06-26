import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import http, { Server } from 'http';
import * as net from 'net';
import WebSocket from 'ws';
import { Call } from '../entities/Call';
import { Message } from '../entities/Message';
import { Session } from '../entities/Session';
import { Thread } from '../entities/Thread';
import { User } from '../entities/User';
import { Connections } from './Connections';
import { handleMessage } from './handleMessage';

//generic message types
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

//chat message types
export interface IncomingSocketChatMessage extends SocketThreadMessage {
  content: string;
  replyingToId?: string;
  resendId?: string;
  media?: string[];
}
export interface ThreadUpdateMessage extends SocketThreadMessage {
  updatedThread: Thread;
}

//call message types

// when user creates a call, this message is sent to everyone in the thread
export interface OutgoingCreateCallMessage extends SocketThreadMessage {
  user: User;
  thread: Thread;
  callId: string;
}

// to close the calling dialog
export interface OutgoingCancelCallMessage extends SocketMessage {
  callId: string;
}

//when a new user joins the thread, this message is sent to everyone in the call
export interface OutgoingJoinCallMessage extends SocketMessage {
  callId: string;
  peerId: string;
  userId: string;
  user: User;
}
export interface IncomingJoinCallMessage extends SocketMessage {
  callId: string;
  peerId: string;
}
//when there are 2 members in the call, this message indicates the actual start of the call
export interface OutgoingStartCallMessage extends SocketMessage {
  callId: string;
  user: User;
  thread: Thread;
}

//to cancel the call for everyone
export interface OutgoingKillCallMessage extends SocketMessage {
  callId: string;
}

export interface IncomingPeerChangeMessage extends SocketMessage {
  peerId: string;
  callId: string;
  audio: boolean;
  camera: boolean;
  screenShare: boolean;
}
export interface OutgoingPeerChangeMessage extends SocketMessage {
  peerId: string;
  userId: string;
  audio: boolean;
  camera: boolean;
  screenShare: boolean;
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
export const CREATE_CALL_CODE = 3010;
export const START_CALL_CODE = 3014;
export const CANCEL_CALL_CODE = 3011;
export const JOIN_CALL_CODE = 3012;
export const KILL_CALL_CODE = 3013;
export const PEER_CHANGE_CODE = 3015;

const HEARTBEAT_INTERVAL = 10000;
const ELAPSED_TIME = 30000;
const THROTTLE_LIMIT = 200;
const THROTTLE_INTERVAL = 500;

export const connections = new Connections();
export const closeConnection = (ws: WebSocket) => {
  ws.removeAllListeners();
  ws.terminate();
};

export const socketController = (server: Server) => {
  const wss = new WebSocket.Server({
    noServer: true,
    // server,
    // port: 7000,
    // host: '192.168.8.105',
    path: '/socket',
    maxPayload: 10 * 1024
  });

  server.on('upgrade', async (req: http.IncomingMessage, socket: net.Socket, head) => {
    console.log('upgrade');
    let userId: string | undefined;

    try {
      // if (req.headers.origin !== browserOrigin) {
      //   return socket.destroy();
      // }
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

      // const subClient = createClient({
      //   url: process.env.REDIS_URL
      // });

      // subClient.on('error', (error) => {
      //   console.error(error);
      // });

      // const pubClient = createClient({
      //   url: process.env.REDIS_URL
      // });

      // pubClient.on('error', (error) => {
      //   console.error(error);
      // });

      wss.emit('connection', ws, req, user);
    });
  });

  wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage, user: User) => {
    console.log('new connection, total connections:', Array.from(wss.clients.entries()).length);
    if (!user.id) return;
    connections.addSocket(user.id, ws);

    await User.update({ id: user.id }, { status: 'online' });
    const heartbeat = setInterval(async () => {
      if (ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED) {
        clearInterval(heartbeat);
        await closeConnectionAndClear();

        return;
      }
      ws.ping('ping', false, async (err) => {
        if (err) {
          console.error(err);
          await closeConnectionAndClear();
          clearInterval(heartbeat);
        }
      });
    }, HEARTBEAT_INTERVAL);

    const elapsed = setTimeout(async () => {
      await closeConnectionAndClear();
    }, ELAPSED_TIME);

    const closeConnectionAndClear = async () => {
      console.log('connection closed');
      closeConnection(ws);
      // subClient.removeAllListeners();
      // subClient.unsubscribe();
      clearTimeout(elapsed);
      clearInterval(heartbeat);
      await User.update({ id: user.id }, { status: 'offline' });

      const latestUser = await User.findOne({
        where: { id: user.id },
        relations: ['threads', 'threads.thread', 'threads.thread.call']
      });
      latestUser?.threads?.forEach(async (thread) => {
        if (thread.thread.call) {
          const { memberIds } = thread.thread.call;
          if (!memberIds) return;
          const newMemberIds = [...memberIds];
          if (newMemberIds.includes(user.id)) {
            newMemberIds.splice(newMemberIds.indexOf(user.id), 1);
            await Call.update({ id: thread.thread.call.id }, { memberIds: newMemberIds });
            const payload: OutgoingCancelCallMessage = {
              code: CANCEL_CALL_CODE,
              callId: thread.thread.call.id
            };

            newMemberIds.forEach((memberId) => {
              connections.getSocket(memberId)?.send(JSON.stringify(payload));
            });
            // pubClient.publish(thread.id, JSON.stringify(payload));
          }
        }
      });
    };

    let sentMessages = 0;
    const delayedMessages: string[] = [];

    const throttle = setInterval(async () => {
      if (delayedMessages.length > 0) {
        await handleMessage(delayedMessages[0], ws, /*subClient, pubClient,*/ user);
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

      await handleMessage(data, ws, user);
    });

    ws.on('pong', () => {
      clearTimeout(elapsed);
      elapsed.refresh();
    });

    ws.on('close', async () => {
      await closeConnectionAndClear();
    });

    // try {
    //   const threads = await ThreadMembers.find({ where: { userId: user.id } });

    //   threads.map((thread) => {
    //     const { threadId } = thread;
    //     subClient.subscribe(threadId);
    //   });
    // } catch (e) {
    //   console.error(e);
    // }

    // subClient.on('message', async (channel, message) => {
    //   const parsed = JSON.parse(message);
    //   if (parsed.code === CHAT_MESSAGE_CODE) {
    //     const { message, threadId } = parsed as SocketChatMessage;
    //     if (message.userId !== user.id) {
    //       const latestUser = await User.findOne({ where: { id: user.id } });
    //       if (latestUser && latestUser.setAsUnread) {
    //         await ThreadMembers.update({ userId: user.id, threadId }, { unread: () => 'unread + 1' });
    //       }
    //     }
    //   }
    //   ws.send(message);
    // });
  });
};
