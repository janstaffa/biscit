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

export interface OutgoingLeaveCallMessage extends SocketMessage {
  userId: string;
  callId: string;
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

// user update message types

export interface OutgoingRequestAcceptMessage extends SocketMessage {
  userId: string;
  username: string;
}
export interface OutgoingRequestSendMessage extends SocketMessage {
  userId: string;
  username: string;
}
export type OutgoingRequestCancelMessage = SocketMessage;
export type OutgoingFriendRemoveMessage = SocketMessage;
export type OutgoingThreadAddMemberMessage = SocketMessage;
export type OutgoingThreadRemoveMemberMessage = SocketMessage;
export interface OutgoingUserStatusChange extends SocketMessage {
  userId: string;
  newStatus: string;
}
export interface OutgoingUserProfileChange extends SocketMessage {
  userId: string;
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
export const LEAVE_CALL_CODE = 3016;
export const REQUEST_ACCEPT_CODE = 3017;
export const REQUEST_SEND_CODE = 3018;
export const REQUEST_CANCEL_CODE = 3019;
export const FRIEND_REMOVE_CODE = 3020;
export const THREAD_ADD_MEMBER_CODE = 3021;
export const THREAD_REMOVE_MEMBER_CODE = 3022;
export const USER_STATUS_CHANGE_CODE = 3023;
export const USER_PROFILE_CHANGE_CODE = 3024;

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
    const user = await User.findOne({
      where: { id: userId },
      relations: ['threads', 'threads.thread', 'threads.thread.members']
    });
    if (!user) return socket.destroy();

    wss.handleUpgrade(req, socket, head, (ws) => {
      const payload = {
        code: AUTH_CODE,
        value: 'authenticated'
      };
      ws.send(JSON.stringify(payload));

      wss.emit('connection', ws, req, user);
    });
  });

  wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage, user: User) => {
    if (!user.id) return;
    connections.addSocket(user.id, ws);

    await User.update({ id: user.id }, { status: 'online' });

    const threadMemberIds = user.threads
      .map((membership) => membership.thread.members.map((member) => member.userId))
      .reduce((a, b) => a.concat(b), []);

    let relatives: string[] = threadMemberIds || [];

    relatives = relatives.filter((item, idx) => {
      return relatives.indexOf(item) == idx;
    });
    relatives.splice(relatives.indexOf(user.id), 1);

    relatives.forEach((relativeId) => {
      const payload: OutgoingUserStatusChange = {
        code: USER_STATUS_CHANGE_CODE,
        userId: user.id,
        newStatus: 'online'
      };
      connections.getSocket(relativeId)?.send(JSON.stringify(payload));
    });

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
      closeConnection(ws);
      clearTimeout(elapsed);
      clearInterval(heartbeat);
      await User.update({ id: user.id }, { status: 'offline', isInCall: false });

      const latestUser = await User.findOne({
        where: { id: user.id },
        relations: ['threads', 'threads.thread', 'threads.thread.call', 'threads.thread.members', 'friends']
      });

      const threadMemberIds = latestUser?.threads
        .map((membership) => membership.thread.members.map((member) => member.userId))
        .reduce((a, b) => a.concat(b), []);

      let relatives: string[] = threadMemberIds || [];

      relatives = relatives.filter((item, idx) => {
        return relatives.indexOf(item) == idx;
      });
      relatives.splice(relatives.indexOf(user.id), 1);

      relatives.forEach((relativeId) => {
        const payload: OutgoingUserStatusChange = {
          code: USER_STATUS_CHANGE_CODE,
          userId: user.id,
          newStatus: 'offline'
        };
        connections.getSocket(relativeId)?.send(JSON.stringify(payload));
      });
      latestUser?.threads?.forEach(async (thread) => {
        if (thread.thread.call) {
          const { memberIds } = thread.thread.call;
          const newMemberIds = [...memberIds];
          if (newMemberIds.includes(user.id)) {
            newMemberIds.splice(newMemberIds.indexOf(user.id), 1);
            if (newMemberIds.length <= 1) {
              await Call.delete({ id: thread.thread.call.id });
              const payload: OutgoingKillCallMessage = {
                code: KILL_CALL_CODE,
                callId: thread.thread.call.id
              };
              newMemberIds.forEach((memberId) => {
                connections.getSocket(memberId)?.send(JSON.stringify(payload));
              });
              return;
            }

            const payload: OutgoingLeaveCallMessage = {
              code: LEAVE_CALL_CODE,
              callId: thread.thread.call.id,
              userId: user.id
            };
            newMemberIds.forEach((memberId) => {
              connections.getSocket(memberId)?.send(JSON.stringify(payload));
            });
          }
        }
      });
    };

    let sentMessages = 0;
    const delayedMessages: string[] = [];

    const throttle = setInterval(async () => {
      if (delayedMessages.length > 0) {
        await handleMessage(delayedMessages[0], ws, user);
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
  });
};
