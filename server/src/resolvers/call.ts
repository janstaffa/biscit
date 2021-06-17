import { createClient } from 'redis';
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { Call } from '../entities/Call';
import { ThreadMembers } from '../entities/ThreadMembers';
import { CancelCallMutationInput, CreateCallMutationInput } from '../entities/types/call';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import { CANCEL_CALL_CODE, CREATE_CALL_CODE, OutgoingCancelCallMessage, OutgoingCreateCallMessage } from '../sockets';
import { ContextType } from '../types';
import { getId } from '../utils/generateId';
import { pickUser } from '../utils/pickUser';
import { GQLValidationError } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType, StringResponse } from './types';

const pubClient = createClient({
  url: process.env.REDIS_URL
});

pubClient.on('error', (error) => {
  console.error(error);
});

@Resolver(Call)
export class CallResolver {
  @Mutation(() => StringResponse)
  @UseMiddleware(isAuth)
  async CreateCall(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: CreateCallMutationInput
  ): Promise<ResponseType<string>> {
    const userId = req.session.userId;

    const member = await ThreadMembers.findOne({
      where: { userId, threadId: options.threadId },
      relations: ['user', 'thread', 'thread.call', 'thread.members', 'thread.members.user']
    });
    const errors: GQLValidationError[] = [];

    if (!member) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "You aren't a member of this thread."
        })
      );
      return {
        data: null,
        errors
      };
    }

    if (member.thread.call) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: 'There is already a call happening in this thread.'
        })
      );
      return {
        data: null,
        errors
      };
    }

    const callId = await getId(Call, 'id');
    await Call.create({ id: callId, threadId: options.threadId, creatorId: userId }).save();

    if (member.thread.isDm) {
      const otherUser = member.thread.members.filter((member) => {
        return member.user.id !== userId;
      });

      member.thread.name = otherUser[0].user.username;
    }

    const pickedMember = pickUser(member.user);
    const payload: OutgoingCreateCallMessage = {
      code: CREATE_CALL_CODE,
      threadId: options.threadId,
      thread: member.thread,
      user: pickedMember as User
    };

    pubClient.publish(options.threadId, JSON.stringify(payload));

    return {
      data: callId,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async CancelCall(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: CancelCallMutationInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const member = await ThreadMembers.findOne({
      where: { userId, threadId: options.threadId },
      relations: ['user', 'thread', 'thread.call', 'thread.members']
    });
    const errors: GQLValidationError[] = [];

    if (!member) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "You aren't a member of this thread."
        })
      );
      return {
        data: false,
        errors
      };
    }

    if (!member.thread.call) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: 'This call was not found.'
        })
      );
      return {
        data: false,
        errors
      };
    }
    if (!member.thread.isDm && userId !== member.thread.call.creatorId) return { data: true, errors };

    await Call.delete({ id: member.thread.call.id });

    const payload: OutgoingCancelCallMessage = {
      code: CANCEL_CALL_CODE,
      threadId: options.threadId
    };

    pubClient.publish(options.threadId, JSON.stringify(payload));

    return {
      data: true,
      errors
    };
  }
}
