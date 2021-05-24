/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Express, Request } from 'express';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import path from 'path';
import temp from 'temp';
import { File } from '../entities/File';
import { getId } from '../utils/generateId';
temp.track();

export const fileUploadController = (app: Express) => {
  app.post('/upload', (req: Request, res) => {
    if (!req.files?.file) {
      return res.send({ error: 'No files were included.' });
    }

    if (!req.body.threadId || typeof req.body.threadId !== 'string') {
      return res.send({ error: 'ThreadID was not provided.' });
    }

    //@ts-ignore
    const userId = req.session.userId;
    if (!userId) {
      return res.send({ error: 'You need to be signed in to upload files.' });
    }

    const uploadFile = async (file: UploadedFile) => {
      console.log(file);
      let extension: string | undefined;
      if (file.name.indexOf('.') !== -1) {
        const dotArray = file.name.split('.');
        extension = dotArray[dotArray.length - 1];
      }

      const id = await getId(File, 'id');
      const newFile = File.create({
        id,
        threadId: req.body.threadId,
        fileName: file.name,
        userId,
        format: extension,
        size: file.size
      });

      fs.writeFile(
        path.join(__dirname, '../../uploaded', newFile.id + '.' + extension),
        file.data,
        { encoding: 'binary' },
        async () => {
          await newFile.save();
          res.send({ status: 'success', fileId: newFile.id });
        }
      );
    };

    if (Array.isArray(req.files.file)) {
      req.files.file.forEach((file: UploadedFile) => {
        uploadFile(file);
      });
    } else {
      uploadFile(req.files.file);
    }
  });

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
};
