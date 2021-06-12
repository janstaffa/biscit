/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Express } from 'express';
import path from 'path';
import { getConnection } from 'typeorm';
import { File } from '../entities/File';
import { FriendRequest } from '../entities/FriendRequest';
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

    res.download(path.join(__dirname, '../../uploaded/', file.id + '.' + file.format), file.fileName);
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

    const file = await ProfilePicture.findOne({ where: { id: fileId } });
    if (!file) {
      return res.send({ error: 'This file was not found.' });
    }
    const members: ThreadMembers[] = await getConnection().query(
      `
            SELECT * FROM thread_members WHERE "threadId" IN (SELECT "threadId" FROM thread_members WHERE "userId" = $1)
          `,
      [userId]
    );

    const requests = await FriendRequest.find({
      where: [
        { senderId: userId, recieverId: file.userId },
        { senderId: file.userId, recieverId: userId }
      ]
    });

    if (!members.find((member) => member.userId === file.userId) && requests.length === 0 && file.userId !== userId) {
      return res.send({ error: 'You are not allowed to view this file.' });
    }

    res.sendFile(path.join(__dirname, '../../uploaded/profilepics/', file.id + '.' + file.format), file.fileName);
  });
};
