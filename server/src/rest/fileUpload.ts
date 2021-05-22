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
      res.send({ error: 'No files were included.' });
      return;
    }

    //@ts-ignore
    const userId = req.session.userId;
    if (!userId) {
      res.send({ error: 'You need to be signed in to upload files.' });
      return;
    }

    const uploadFile = async (file: UploadedFile) => {
      console.log(file);
      let extension: string | undefined;
      if (file.name.indexOf('.') !== -1) {
        const dotArray = file.name.split('.');
        extension = dotArray[dotArray.length - 1];
      }

      const id = await getId(File, 'id');
      await File.create({ id, fileName: file.name, userId, format: extension, size: file.size });

      fs.writeFile(path.join(__dirname, '../../uploaded', file.name), file.data, { encoding: 'binary' }, () => {
        console.log('done');
      });
    };

    if (Array.isArray(req.files.file)) {
      req.files.file.forEach((file: UploadedFile) => {
        uploadFile(file);
      });
    } else {
      uploadFile(req.files.file);
    }
  });
};
