/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Express, Request } from 'express';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { validProfilePictureUploadRegExp } from '../constants';
import { File } from '../entities/File';
import { ProfilePicture } from '../entities/ProfilePicture';
import { Thread } from '../entities/Thread';
import { User } from '../entities/User';
import {
  connections,
  OutgoingUserProfileChange,
  SocketThreadMessage,
  THREAD_CHANGE_CODE,
  USER_PROFILE_CHANGE_CODE
} from '../sockets';
import { getId } from '../utils/generateId';

export const fileUploadController = (app: Express) => {
  // const pubClient = createClient({
  //   url: process.env.REDIS_URL
  // });
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
          path.join('/upload', newFile.id.replace(/\./g, '') + (extension ? '.' + extension.replace(/\./g, '') : '')),
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

  app.post('/upload/profilep', async (req: Request, res) => {
    if (!req.files?.file) {
      return res.send({ error: 'No files were included.' });
    }
    if (!(req.files?.file as UploadedFile).mimetype.includes('image/')) {
      return res.send({ error: 'Uploaded file is not an image.' });
    }
    if (!validProfilePictureUploadRegExp.test((req.files?.file as UploadedFile).mimetype)) {
      return res.send({ error: 'Invalid format.' });
    }
    if (!Array.isArray(req.files.file) && !req.files.file.truncated) {
      //@ts-ignore
      const userId = req.session.userId;
      if (!userId) {
        return res.send({ error: 'You need to be signed in to upload files.' });
      }
      const user = await User.findOne({
        where: { id: userId },
        relations: ['profile_picture', 'threads', 'threads.thread', 'threads.thread.members']
      });
      if (!user) {
        return res.send({ error: 'Your account was not found.' });
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

        const isThreadPicture = !!req.body.threadId;
        if (isThreadPicture) {
          const thread = await Thread.findOne({ where: { id: req.body.threadId } });
          if (!thread) {
            return res.send({ error: 'This thread was not found.' });
          }
          if (thread?.creatorId !== userId) {
            return res.send({ error: 'Only the creator can cahnge the thread picture.' });
          }
        }
        const newFile = ProfilePicture.create({
          id,
          fileName: file.name,
          isThreadPicture,
          userId: isThreadPicture ? undefined : userId,
          threadId: req.body.threadId,
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
              '/upload/profilepics',
              newFile.id.replace(/\./g, '') + (extension ? '.' + extension.replace(/\./g, '') : '')
            )
          )
          .then(async () => {
            try {
              const key = isThreadPicture ? 'threadId' : 'userId';
              const value = isThreadPicture ? req.body.threadId : userId;
              const profilePicture = await ProfilePicture.findOne({
                where: { [key]: value }
              });
              if (profilePicture) {
                const ppId = isThreadPicture ? profilePicture.id : user.profile_pictureId;
                const ppFormat = isThreadPicture ? profilePicture.format : user.profile_picture.format;

                await new Promise((resolve, reject) =>
                  fs.unlink(
                    path.join(
                      '/upload/profilepics',
                      ppId.replace(/\./g, '') + (ppFormat ? '.' + ppFormat.replace(/\./g, '') : '')
                    ),
                    async (err) => {
                      try {
                        if (err) throw err;
                        await ProfilePicture.delete({ id: ppId });
                        resolve(true);
                      } catch (e) {
                        console.error(e);
                        if (e.errno === -4058) {
                          return res.send({ error: 'This file was not found.' });
                        }
                        reject(e);
                      }
                    }
                  )
                );
              }

              await newFile.save();
              if (isThreadPicture) {
                await Thread.update({ id: req.body.threadId }, { thread_pictureId: newFile.id });

                const thread = await Thread.findOne({ where: { id: req.body.threadId }, relations: ['members'] });

                const payload: SocketThreadMessage = {
                  code: THREAD_CHANGE_CODE,
                  threadId: req.body.threadId
                };
                thread?.members.forEach((member) => {
                  connections.getSocket(member.userId)?.send(JSON.stringify(payload));
                });
              } else {
                await User.update({ id: user.id }, { profile_pictureId: newFile.id });

                const threadMemberIds = user.threads
                  .map((membership) => membership.thread.members.map((member) => member.userId))
                  .reduce((a, b) => a.concat(b), []);

                let relatives: string[] = threadMemberIds || [];

                relatives = relatives.filter((item, idx) => {
                  return relatives.indexOf(item) == idx;
                });
                relatives.splice(relatives.indexOf(user.id), 1);

                relatives.forEach((relativeId) => {
                  const payload: OutgoingUserProfileChange = {
                    code: USER_PROFILE_CHANGE_CODE,
                    userId: user.id
                  };
                  connections.getSocket(relativeId)?.send(JSON.stringify(payload));
                });
              }

              res.send({ status: 'success', fileId: newFile.id });
            } catch (e) {
              console.error(e);
            }
          })
          .catch((err) => {
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
};
