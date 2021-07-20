import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createQueryBuilder } from 'typeorm';
import WebSocket from 'ws';
import {
  CHAT_MESSAGE_CODE,
  CHAT_TYPING_CODE,
  closeConnection,
  connections,
  ERROR_MESSAGE_CODE,
  IncomingJoinCallMessage,
  IncomingPeerChangeMessage,
  IncomingSocketChatMessage,
  JOIN_CALL_CODE,
  JOIN_THREAD_CODE,
  OutgoingJoinCallMessage,
  OutgoingPeerChangeMessage,
  PEER_CHANGE_CODE,
  SocketChatMessage,
  SocketThreadMessage
} from '.';
import { fallbackTokenSecret } from '../constants';
import { Call } from '../entities/Call';
import { File } from '../entities/File';
import { Message } from '../entities/Message';
import { Thread } from '../entities/Thread';
import { ThreadMembers } from '../entities/ThreadMembers';
import { User } from '../entities/User';
import { getId } from '../utils/generateId';
import { pickUser } from '../utils/pickUser';

export type JWTWSTokenType = {
  userId: string;
};

export const handleMessage = async (data: string, ws: WebSocket, user: User) => {
  const returnInvalidTokenError = () => {
    const payload = {
      code: ERROR_MESSAGE_CODE,
      message: 'Invalid socket token.'
    };
    ws.send(JSON.stringify(payload));
    ws.terminate();
    return;
  };
  const incoming = JSON.parse(data);
  const { code, token } = incoming;

  if (!token) {
    returnInvalidTokenError();
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET || fallbackTokenSecret);
    if ((decoded as JWTWSTokenType).userId !== user.id) {
      returnInvalidTokenError();
      return;
    }
  } catch (e) {
    if (e) {
      returnInvalidTokenError();
      return;
    }
  }

  const senderUser = await User.findOne({ where: { id: user.id }, relations: ['profile_picture'] });

  if (!senderUser) {
    const payload = { code: ERROR_MESSAGE_CODE, message: "It seems like, you don't exist!" };
    ws.send(JSON.stringify(payload));
    closeConnection(ws);
    await User.update({ id: user.id }, { status: 'offline' });

    return;
  }

  if (code === CHAT_MESSAGE_CODE) {
    const { content, threadId, replyingToId, resendId, media } = incoming as IncomingSocketChatMessage;

    try {
      const messageId = await getId(Message, 'id');

      let realMedia = media;
      if (resendId && media && media.length > 0) {
        const files = await File.findByIds(media);
        if (files.length > 0) {
          realMedia = await Promise.all(
            files.map(async (file) => {
              return new Promise<string>(async (resolve, reject) => {
                const newId = await getId(File, 'id');
                fs.copyFile(
                  path.join(
                    __dirname,
                    '../../uploaded',
                    file.id.replace(/\./g, '') + (file.format ? '.' + file.format.replace(/\./g, '') : '')
                  ),
                  path.join(
                    __dirname,
                    '../../uploaded',
                    newId.replace(/\./g, '') + (file.format ? '.' + file.format.replace(/\./g, '') : '')
                  ),
                  async (err) => {
                    try {
                      if (err) throw err;
                      await File.create({
                        ...file,
                        id: newId,
                        userId: user.id,
                        threadId
                      }).save();
                      resolve(newId);
                    } catch (e) {
                      console.error(e);
                      reject(e);
                    }
                  }
                );
              });
            })
          );
        }
      }

      const newMessage = await Message.create({
        id: messageId,
        content,
        threadId,
        userId: user.id,
        edited: false,
        resendId,
        replyingToId: resendId ? undefined : replyingToId,
        replyingTo:
          !resendId && replyingToId
            ? await Message.findOne({ where: { id: replyingToId }, relations: ['user'] })
            : undefined,
        mediaIds: realMedia,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (newMessage.mediaIds && newMessage.mediaIds.length > 0) {
        const files = await createQueryBuilder(File, 'file')
          .leftJoinAndSelect('file.user', 'user')
          .where('file.id IN (:...ids)', { ids: newMessage.mediaIds })
          .getMany();
        if (files && files.length > 0) {
          newMessage.media = files;
        }
      }
      const membership = await ThreadMembers.findOne({
        where: { userId: user.id, threadId },
        relations: ['thread', 'thread.members']
      });
      if (!membership) {
        const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' };
        ws.send(JSON.stringify(payload));
        return;
      }
      newMessage.save();

      await Thread.update({ id: threadId }, { lastActivity: new Date() });

      const pickedSender = pickUser(senderUser);

      const payload: SocketChatMessage = {
        threadId,
        code: CHAT_MESSAGE_CODE,
        message: {
          ...newMessage,
          user: pickedSender as User
        } as Message
      };

      membership.thread.members.forEach((member) => {
        connections.getSocket(member.userId)?.send(JSON.stringify(payload));
      });
    } catch (e) {
      console.error(e);
    }
  } else if (code === JOIN_THREAD_CODE) {
    const { threadId } = incoming as SocketThreadMessage;
    if (!threadId) return;

    try {
      const membership = await ThreadMembers.update({ threadId, userId: user.id }, { unread: 0 });
      if (!membership.affected || membership.affected !== 1) {
        const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this thread' };
        ws.send(JSON.stringify(payload));
        return;
      }
    } catch (e) {
      console.error(e);
    }
  } else if (code === CHAT_TYPING_CODE) {
    const { threadId } = incoming as SocketThreadMessage;
    if (!threadId) return;
    try {
      const payload: SocketThreadMessage & { username: string } = {
        code: CHAT_TYPING_CODE,
        threadId,
        username: user.username
      };

      const thread = await Thread.findOne({ where: { id: threadId }, relations: ['members'] });
      if (!thread) return;
      thread.members.forEach((member) => {
        connections.getSocket(member.userId)?.send(JSON.stringify(payload));
      });
    } catch (e) {
      console.error(e);
    }
  } else if (code === JOIN_CALL_CODE) {
    const { callId, peerId } = incoming as IncomingJoinCallMessage;
    if (!callId || !peerId) return;
    try {
      const call = await Call.findOne({ where: { id: callId }, relations: ['members', 'thread', 'thread.members'] });
      if (!call?.thread) return;
      if (!call.members.find((member) => member.id === user.id)) {
        const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this call.' };
        ws.send(JSON.stringify(payload));
        return;
      }

      const payload: OutgoingJoinCallMessage = {
        code: JOIN_CALL_CODE,
        callId,
        userId: user.id,
        user: pickUser(user) as User,
        peerId
      };

      for (const member of call.members) {
        if (member.id === user.id) continue;
        connections.getSocket(member.id)?.send(JSON.stringify(payload));
      }
    } catch (e) {
      console.error(e);
    }
  } else if (code === PEER_CHANGE_CODE) {
    const { callId, peerId, audio, camera, screenShare } = incoming as IncomingPeerChangeMessage;
    if (!callId || !peerId) return;
    try {
      const call = await Call.findOne({ where: { id: callId }, relations: ['members', 'thread', 'thread.members'] });
      if (!call?.thread) return;
      if (!call.members.find((member) => member.id === user.id)) {
        const payload = { code: ERROR_MESSAGE_CODE, message: 'You are not a member of this call.' };
        ws.send(JSON.stringify(payload));
        return;
      }

      const payload: OutgoingPeerChangeMessage = {
        code: PEER_CHANGE_CODE,
        userId: user.id,
        peerId,
        audio,
        camera,
        screenShare
      };

      for (const member of call.members) {
        if (member.id === user.id) continue;
        connections.getSocket(member.id)?.send(JSON.stringify(payload));
      }
    } catch (e) {
      console.error(e);
    }
  }
};
