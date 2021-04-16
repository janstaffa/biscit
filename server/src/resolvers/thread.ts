import { Arg, Ctx, Query, Resolver, UseMiddleware } from 'type-graphql';
import { Thread } from '../entities/Thread';
import { ThreadMembers } from '../entities/ThreadMembers';
import { ThreadQueryInput } from '../entities/types/thread';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import { ContextType } from '../types';
import { GQLValidationError } from '../utils/validateYupSchema';
import { ResponseType, ThreadResponse } from './types';

@Resolver(User)
export class ThreadResolver {
  @Query(() => ThreadResponse)
  @UseMiddleware(isAuth)
  async thread(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: ThreadQueryInput
  ): Promise<ResponseType<Thread>> {
    const userId = req.session.userId;
    const thread = await Thread.findOne({
      where: { id: options.threadId },
      relations: ['members', 'members.user'],
    });
    const errors: GQLValidationError[] = [];

    if (!thread) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "This thread doesn't exist.",
        })
      );
      return {
        data: null,
        errors,
      };
    }
    const membership = await ThreadMembers.findOne({
      where: { threadId: options.threadId, userId },
    });

    if (!membership) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "You aren't a member of this thread.",
        })
      );
      return {
        data: null,
        errors,
      };
    }

    if (thread.isDm) {
      const otherUser = thread.members.filter((member) => {
        return member.user.id !== userId;
      });

      thread.name = otherUser[0].user.username;
    }

    return {
      data: thread,
      errors,
    };
  }
}
