import fs from 'fs';
import path from 'path';
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { getRepository } from 'typeorm';
import { File } from '../entities/File';
import { Message } from '../entities/Message';
import { DeleteFileMutationInput } from '../entities/types/file';
import { isAuth } from '../middleware/isAuth';
import { ContextType } from '../types';
import { GQLValidationError } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType } from './types';

// const pubClient = createClient({
//   url: process.env.REDIS_URL
// });

// pubClient.on('error', (error) => {
//   console.error(error);
// });

@Resolver(File)
export class FileResolver {
  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async DeleteFile(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: DeleteFileMutationInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const file = await File.findOne({
      where: { userId, id: options.fileId }
    });
    const errors: GQLValidationError[] = [];

    if (!file) {
      errors.push(
        new GQLValidationError({
          field: 'fileId',
          value: options.fileId,
          message: "This file doesn't exist, or it wasn't uploaded by you."
        })
      );
      return {
        data: false,
        errors
      };
    }

    return new Promise((resolve, reject) => {
      fs.unlink(
        path.join(
          __dirname,
          '../../uploaded',
          options.fileId.replace(/\./g, '') + (file.format ? '.' + file.format.replace(/\./g, '') : '')
        ),
        async (err) => {
          try {
            if (err) {
              console.error(err);
              return;
            }

            await getRepository(Message).query(
              `
                UPDATE message SET "mediaIds" = array_remove("mediaIds", $1) WHERE $1 = ANY("mediaIds");
              `,
              [file.id]
            );
            await File.remove(file);

            resolve({
              data: true,
              errors
            });
          } catch (e) {
            console.error(e);
            reject(e);
          }
        }
      );
    });
  }
}
