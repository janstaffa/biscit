import { Express } from 'express';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import path from 'path';

const uploadFile = (file: UploadedFile) => {
  fs.writeFile(path.join(__dirname, '../../uploaded', file.name), file.data, { encoding: 'binary' }, () => {
    console.log('done');
  });
};
export const fileUploadController = (app: Express) => {
  app.post('/upload', (req, res) => {
    if (!req.files?.files) {
      res.send({ error: 'No files were included.' });
      return;
    }

    const userId = req.session.userId;
    if (!userId) {
      res.send({ error: 'You need to be signed in to upload files.' });
      return;
    }

    if (Array.isArray(req.files.files)) {
      req.files.files.forEach((file: UploadedFile) => {
        uploadFile(file);
      });
    } else {
      uploadFile(req.files.files);
    }
  });
};
