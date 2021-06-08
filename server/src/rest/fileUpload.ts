/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Express, Request } from 'express';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { File } from '../entities/File';
import { ProfilePicture } from '../entities/ProfilePicture';
import { User } from '../entities/User';
import { getId } from '../utils/generateId';

export const fileUploadController = (app: Express) => {
  app.post('/upload/attachment', (req: Request, res) => {
    if (!req.files?.file) {
      return res.send({ error: 'No files were included.' });
    }

    if (!Array.isArray(req.files.file) && !req.files.file.truncated) {
      if (!req.body.threadId || typeof req.body.threadId !== 'string') {
        return res.send({ error: 'ThreadID was not provided.' });
      }

      //@ts-ignore
      const userId = req.session.userId;
      if (!userId) {
        return res.send({ error: 'You need to be signed in to upload files.' });
      }

      const uploadFile = async (file: UploadedFile) => {
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
          path.join(
            __dirname,
            '../../uploaded',
            newFile.id.replace(/\./g, '') + (extension ? '.' + extension.replace(/\./g, '') : '')
          ),
          file.data,
          { encoding: 'binary' },
          async () => {
            try {
              await newFile.save();
              res.send({ status: 'success', fileId: newFile.id });
            } catch (e) {
              console.error(e);
            }
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
    }
  });

  app.post('/upload/profilep', (req: Request, res) => {
    if (!req.files?.file) {
      return res.send({ error: 'No files were included.' });
    }
    if (!(req.files?.file as UploadedFile).mimetype.includes('image/')) {
      return res.send({ error: 'Uploaded file is not an image.' });
    }
    if (!Array.isArray(req.files.file) && !req.files.file.truncated) {
      //@ts-ignore
      const userId = req.session.userId;
      if (!userId) {
        return res.send({ error: 'You need to be signed in to upload files.' });
      }

      const uploadFile = async (file: UploadedFile) => {
        let extension: string | undefined;
        if (file.name.indexOf('.') !== -1) {
          const dotArray = file.name.split('.');
          extension = dotArray[dotArray.length - 1];
        }

        const { width, height, left, top } = JSON.parse(req.body.dimensions) as {
          top: number;
          left: number;
          width: number;
          height: number;
        };
        const id = await getId(ProfilePicture, 'id');

        const newFile = ProfilePicture.create({
          id,
          fileName: file.name,
          userId,
          format: extension,
          size: file.size
        });

        if (width < 0 || height < 0 || top < 0 || left < 0) {
          return res.send({ error: 'Dimension parameters must be provided.' });
        }
        sharp(file.data)
          .extract({
            width: Math.floor(width),
            height: Math.floor(height),
            top: Math.floor(top),
            left: Math.floor(left)
          })
          .toFile(
            path.join(
              __dirname,
              '../../uploaded/profilepics',
              newFile.id.replace(/\./g, '') + (extension ? '.' + extension.replace(/\./g, '') : '')
            )
          )
          .then(async () => {
            try {
              const user = await User.findOne({ where: { id: userId }, relations: ['profile_picture'] });
              if (!user) return;

              if (user?.profile_picture) {
                await new Promise((resolve, reject) =>
                  fs.unlink(
                    path.join(
                      __dirname,
                      '../../uploaded/profilepics',
                      user.profile_picture.id.replace(/\./g, '') +
                        (user.profile_picture.format ? '.' + user.profile_picture.format.replace(/\./g, '') : '')
                    ),
                    async (err) => {
                      try {
                        if (err) throw err;
                        await ProfilePicture.delete({ id: user.profile_picture.id });
                        resolve(true);
                      } catch (e) {
                        console.error(e);
                        reject(e);
                      }
                    }
                  )
                );
              }
              await newFile.save();
              user.profile_pictureId = newFile.id;
              await user.save();
              res.send({ status: 'success', fileId: newFile.id });
            } catch (e) {
              console.error(e);
            }
          })
          .catch((err) => {
            console.log('error');
            console.error(err);
          });
      };

      if (Array.isArray(req.files.file)) {
        req.files.file.forEach((file: UploadedFile) => {
          uploadFile(file);
        });
      } else {
        uploadFile(req.files.file);
      }
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

    if (file.userId !== userId) {
      return res.send({ error: "This file wasn't uploaded by you." });
    }

    res.sendFile(path.join(__dirname, '../../uploaded/profilepics/', file.id + '.' + file.format), file.fileName);
  });
};
