/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Express, Request } from 'express';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import path from 'path';
import { File } from '../entities/File';
import { getId } from '../utils/generateId';

export const fileUploadController = (app: Express) => {
  app.post('/upload', (req: Request, res) => {
    if (!req.files?.file) {
      return res.send({ error: 'No files were included.' });
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
      const newFile = File.create({ id, fileName: file.name, userId, format: extension, size: file.size });

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

    const file = await File.findOne({ where: { id: fileId } });

    if (!file) {
      return res.send({ error: 'This file was not found.' });
    }

    res.sendFile(path.join(__dirname, '../../uploaded', fileId + '.' + file.format));
    // const friend = await
  });
};
