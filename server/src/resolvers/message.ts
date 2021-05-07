import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { createQueryBuilder } from 'typeorm';
import { Message } from '../entities/Message';
import { ThreadMembers } from '../entities/ThreadMembers';
import {
  DeleteMessageMutationInput,
  ThreadMessagesQueryInput,
  UpdateMessageMutationInput
} from '../entities/types/message';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import { ContextType } from '../types';
import { GQLValidationError } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType, ThreadMessagesResponse, ThreadMessagesResponseType } from './types';

@Resolver(User)
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
        hasMore: false,
        errors
      };
    }

    const realLimit = Math.min(50, options.limit);
    const realLimitPlusOne = realLimit + 1;

    const qb = createQueryBuilder(Message, 'message')
      .leftJoinAndSelect('message.user', 'user')
      .where('message."threadId" = :threadId', { threadId: options.threadId });

    if (options.cursor) {
      console.log('CURSOR:', new Date(parseInt(options.cursor)));
      qb.andWhere('message."createdAt" < :cursor', { cursor: new Date(parseInt(options.cursor)) });
    }
    qb.orderBy('message."createdAt"', 'DESC').limit(realLimitPlusOne);

    const messages = (await qb.getMany()) as Message[];

    return {
      data: messages.slice(0, realLimit).reverse(),
      hasMore: messages.length === realLimitPlusOne,
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

    const message = await Message.update(
      { userId, id: options.messageId },
      { content: options.newContent, edited: true }
    );
    console.log('message:', message);
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

    return {
      data: true,
      errors
    };
  }
}
