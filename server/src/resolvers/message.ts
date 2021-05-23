import { createClient } from 'redis';
import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { createQueryBuilder, getRepository } from 'typeorm';
import { File } from '../entities/File';
import { Message } from '../entities/Message';
import { ThreadMembers } from '../entities/ThreadMembers';
import {
  DeleteMessageMutationInput,
  ThreadMessagesQueryInput,
  UpdateMessageMutationInput
} from '../entities/types/message';
import { isAuth } from '../middleware/isAuth';
import { DELETE_MESSAGE_CODE, UPDATE_MESSAGE_CODE } from '../sockets';
import { ContextType } from '../types';
import { GQLValidationError } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType, ThreadMessagesResponse, ThreadMessagesResponseType } from './types';

const pubClient = createClient({
  url: process.env.REDIS_URL
});

pubClient.on('error', (error) => {
  console.error(error);
});

@Resolver(Message)
export class MessageResolver {
  @Query(() => ThreadMessagesResponse)
  @UseMiddleware(isAuth)
  async messages(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: ThreadMessagesQueryInput
  ): Promise<ThreadMessagesResponseType> {
    const userId = req.session.userId;

    const membership = await ThreadMembers.findOne({
      where: { threadId: options.threadId, userId }
    });
    const errors: GQLValidationError[] = [];

    if (!membership) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "You aren't a member of this thread."
        })
      );
      return {
        data: null,
        nextMessage: null,
        errors
      };
    }

    const realLimit = Math.min(50, options.limit);
    const realLimitPlusOne = realLimit + 1;

    const qb = createQueryBuilder(Message, 'message')
      .leftJoinAndSelect('message.user', 'user')
      .leftJoinAndSelect('message.replyingTo', 'replyingTo')
      .leftJoinAndSelect('replyingTo.user', 'replyingToUser')
      .where('message."threadId" = :threadId', { threadId: options.threadId });

    if (options.cursor) {
      qb.andWhere('message."createdAt" < :cursor', { cursor: new Date(parseInt(options.cursor)) });
    }
    qb.orderBy('message."createdAt"', 'DESC').limit(realLimitPlusOne);

    const messages = (await qb.getMany()) as Message[];

    const newMessages = (await Promise.all(
      messages.map(async (message) => {
        if (message.mediaIds && message.mediaIds.length > 0) {
          console.log(message);
          const files = await createQueryBuilder(File, 'file')
            .leftJoinAndSelect('file.user', 'user')
            .where('file.id IN (:...ids)', { ids: message.mediaIds })
            .getMany();
          console.log(files);
          return {
            ...message,
            media: files
          };
        }
        return message;
      })
    )) as Message[];
    const realMessages = newMessages.slice(0, realLimit).reverse();
    return {
      data: realMessages,
      nextMessage: realMessages[0],
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async DeleteMessage(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: DeleteMessageMutationInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const message = await Message.findOne({
      where: { userId, id: options.messageId }
    });
    const errors: GQLValidationError[] = [];

    if (!message) {
      errors.push(
        new GQLValidationError({
          field: 'messageId',
          value: options.messageId,
          message: "This message wasn't sent by you."
        })
      );
      return {
        data: false,
        errors
      };
    }

    await Message.remove(message);

    const payload = {
      code: DELETE_MESSAGE_CODE,
      threadId: message.threadId,
      messageId: options.messageId
    };

    pubClient.publish(message.threadId, JSON.stringify(payload));
    return {
      data: true,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async UpdateMessage(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: UpdateMessageMutationInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const message = await getRepository(Message)
      .createQueryBuilder()
      .update({
        content: options.newContent,
        edited: true
      })
      .where('id = :id AND "userId" = :userId', { id: options.messageId, userId })
      .returning('*')
      .updateEntity(true)
      .execute();

    const errors: GQLValidationError[] = [];

    if (message.affected !== 1) {
      errors.push(
        new GQLValidationError({
          field: 'messageId',
          value: options.messageId,
          message: "This message wasn't sent by you."
        })
      );
      return {
        data: false,
        errors
      };
    }

    const rawMessage = message.raw[0];

    const payload = {
      code: UPDATE_MESSAGE_CODE,
      threadId: rawMessage.threadId,
      messageId: options.messageId,
      newContent: options.newContent
    };
    pubClient.publish(rawMessage.threadId, JSON.stringify(payload));

    return {
      data: true,
      errors
    };
  }
}
