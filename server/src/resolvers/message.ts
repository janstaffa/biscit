import { Arg, Ctx, Query, Resolver, UseMiddleware } from 'type-graphql';
import { createQueryBuilder } from 'typeorm';
import { Message } from '../entities/Message';
import { ThreadMembers } from '../entities/ThreadMembers';
import { ThreadMessagesQueryInput } from '../entities/types/message';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import { ContextType } from '../types';
import { GQLValidationError } from '../utils/validateYupSchema';
import { ThreadMessagesResponse, ThreadMessagesResponseType } from './types';

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
}
