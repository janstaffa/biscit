/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Express } from 'express';
import path from 'path';
import { getConnection } from 'typeorm';
import { File } from '../entities/File';
import { ProfilePicture } from '../entities/ProfilePicture';
import { ThreadMembers } from '../entities/ThreadMembers';

export const getFilesController = (app: Express) => {
  app.get('/files/:fileId', async (req, res) => {
    //@ts-ignore
    const userId = req.session.userId;

    if (!userId) {
      return res.send({ error: 'You must be signed in to proceed.' });
    }
    const fileId = req.params.fileId;
    if (!fileId) {
      return res.send({ error: 'File id was not provided.' });
    }

    const file = await File.findOne({ where: { id: fileId }, relations: ['thread', 'thread.members'] });

    if (!file) {
      return res.send({ error: 'This file was not found.' });
    }

    const thisUser = file.thread.members.find((member) => member.userId === userId);
    if (!thisUser) {
      return res.send({ error: 'You dont have access to view this file.' });
    }

    res.download(path.join('/upload', file.id + '.' + file.format), file.fileName);
  });

  app.get('/files/profilep/:fileId', async (req, res) => {
    //@ts-ignore
    const userId = req.session.userId;

    if (!userId) {
      return res.send({ error: 'You must be signed in to proceed.' });
    }
    const fileId = req.params.fileId;
    if (!fileId) {
      return res.send({ error: 'File id was not provided.' });
    }

    const file = await ProfilePicture.findOne({ where: { id: fileId }, relations: ['user', 'user.friend_requests'] });
    if (!file) {
      return res.send({ error: 'This file was not found.' });
    }

    if (!file.isThreadPicture) {
      const members: ThreadMembers[] = await getConnection().query(
        `
              SELECT * FROM thread_members WHERE "threadId" IN (SELECT "threadId" FROM thread_members WHERE "userId" = $1)
            `,
        [userId]
      );

      const requests = file.user.friend_requests;
      if (
        !members.find((member) => member.userId === file.userId) &&
        !requests.find((request) => request.senderId === userId || request.recieverId === userId) &&
        file.userId !== userId
      ) {
        return res.send({ error: 'You are not allowed to view this file.' });
      }
    } else {
      const members = await ThreadMembers.find({ where: { threadId: file.threadId } });
      if (!members.find((member) => member.userId === userId)) {
        return res.send({ error: 'You are not allowed to view this file.' });
      }
    }

    res.sendFile(path.join('/upload/profilepics/', file.id + '.' + file.format), file.fileName);
  });
};
