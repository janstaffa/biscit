import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { Call } from '../entities/Call';
import { Thread } from '../entities/Thread';
import { ThreadMembers } from '../entities/ThreadMembers';
import {
  CancelCallMutationInput,
  CreateCallMutationInput,
  JoinCallMutationInput,
  LeaveCallMutationInput
} from '../entities/types/call';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import {
  CANCEL_CALL_CODE,
  connections,
  CREATE_CALL_CODE,
  KILL_CALL_CODE,
  LEAVE_CALL_CODE,
  OutgoingCancelCallMessage,
  OutgoingCreateCallMessage,
  OutgoingKillCallMessage,
  OutgoingLeaveCallMessage,
  OutgoingStartCallMessage,
  SocketThreadMessage,
  START_CALL_CODE,
  THREAD_CHANGE_CODE
} from '../sockets';
import { ContextType } from '../types';
import { getId } from '../utils/generateId';
import { pickUser } from '../utils/pickUser';
import { GQLValidationError } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType, StringResponse } from './types';

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
      relations: ['user', 'thread', 'thread.call', 'thread.call.members', 'thread.members', 'thread.members.user']
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

    if (member.user.isInCall) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "You can't join two calls at once."
        })
      );
      return {
        data: null,
        errors
      };
    }

    if (member.thread.call) {
      if (!member.thread.call?.members || member.thread.call?.members.length === 0) {
        await Call.delete({ threadId: options.threadId });
      } else {
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
    }
    if (member.thread.isDm) {
      const otherUser = member.thread.members.find((member) => {
        return member.user.id !== userId;
      });
      if (otherUser?.user.isInCall) {
        errors.push(
          new GQLValidationError({
            field: 'threadId',
            value: options.threadId,
            message: 'This user is already in a call.'
          })
        );
        return {
          data: null,
          errors
        };
      }
    }

    const callId = await getId(Call, 'id');
    await Call.create({
      id: callId,
      accepted: false,
      threadId: options.threadId,
      creatorId: userId
    }).save();
    await User.update({ id: userId }, { isInCall: true, callId });

    if (member.thread.isDm) {
      const otherUser = member.thread.members.filter((member) => {
        return member.user.id !== userId;
      });

      member.thread.name = otherUser[0].user.username;
    }

    const callingThread = {
      ...member.thread,
      members: member.thread.members.map((member) => {
        return { ...member, user: pickUser(member.user) };
      })
    };

    const pickedMember = pickUser(member.user);
    const payload: OutgoingCreateCallMessage = {
      code: CREATE_CALL_CODE,
      threadId: options.threadId,
      thread: callingThread as Thread,
      user: pickedMember as User,
      callId
    };

    member.thread.members.forEach((member) => {
      connections.getSocket(member.userId)?.send(JSON.stringify(payload));
    });

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

    const call = await Call.findOne({
      where: { id: options.callId },
      relations: ['members', 'thread', 'thread.members']
    });

    const errors: GQLValidationError[] = [];

    if (!call) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: 'This call was not found.'
        })
      );
      return {
        data: false,
        errors
      };
    }
    const isMember = call.thread.members.find((m) => m.userId === userId);
    if (!isMember) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: "You aren't a member of the thread where this call originates."
        })
      );
      return {
        data: false,
        errors
      };
    }

    if (call.accepted) return { data: true, errors };
    if (userId === call.creatorId || call.thread.isDm) {
      const payload: OutgoingCancelCallMessage = {
        code: CANCEL_CALL_CODE,
        callId: call.id
      };

      call.thread.members.forEach((member) => {
        connections.getSocket(member.userId)?.send(JSON.stringify(payload));
      });

      for (const member of call.members) {
        await User.update({ id: member.id }, { isInCall: false /*callId: null*/ });
      }
      await Call.delete({ id: call.id });
    }

    return {
      data: true,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async JoinCall(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: JoinCallMutationInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;
    const user = await User.findOne({ where: { id: userId } });
    const errors: GQLValidationError[] = [];

    if (!user) {
      errors.push(
        new GQLValidationError({
          field: 'userId',
          value: userId,
          message: "It seems like, you don't exist."
        })
      );
      return {
        data: false,
        errors
      };
    }

    if (user.isInCall) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: 'You are already in a call.'
        })
      );
      return {
        data: false,
        errors
      };
    }
    const call = await Call.findOne({
      where: { id: options.callId },
      relations: ['members', 'thread', 'thread.members']
    });

    if (!call) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: 'This call was not found.'
        })
      );
      return {
        data: false,
        errors
      };
    }
    const isMember = call.thread.members?.find((member) => member.userId === userId);

    if (!isMember) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: "You aren't a member of the thread where this call originates."
        })
      );
      return {
        data: false,
        errors
      };
    }

    if (call.members.find((member) => member.id === userId)) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: 'You are already a member of this call.'
        })
      );
      return {
        data: false,
        errors
      };
    }

    if (!call.accepted) {
      await Thread.update({ id: call.threadId }, { lastActivity: new Date() });
      await Call.update({ id: options.callId }, { accepted: true });
    }

    await User.update({ id: userId }, { isInCall: true, callId: call.id });

    const startCallPayload: OutgoingStartCallMessage = {
      code: START_CALL_CODE,
      callId: call.id,
      user: pickUser(user) as User,
      thread: call.thread
    };

    if (!call.accepted) {
      [...call.members.map((member) => member.id), userId].forEach((memberId) => {
        connections.getSocket(memberId)?.send(JSON.stringify(startCallPayload));
      });
    }

    const threadChangePayload: SocketThreadMessage = {
      code: THREAD_CHANGE_CODE,
      threadId: call.threadId
    };
    call.thread?.members.forEach((member) => {
      connections.getSocket(member.userId)?.send(JSON.stringify(threadChangePayload));
    });

    return {
      data: true,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async LeaveCall(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: LeaveCallMutationInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const call = await Call.findOne({
      where: { id: options.callId },
      relations: ['members', 'thread', 'thread.members']
    });
    const errors: GQLValidationError[] = [];

    if (!call) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: 'This call was not found.'
        })
      );
      return {
        data: false,
        errors
      };
    }

    const isMember = call.thread.members?.find((member) => member.userId === userId);
    if (!isMember) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: "You aren't a member of the thread where this call originates."
        })
      );
      return {
        data: false,
        errors
      };
    }
    if (!call.members.find((member) => member.id === userId)) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: "You aren't a member of this call."
        })
      );
      return {
        data: false,
        errors
      };
    }

    console.log(options.callId, call.members);
    if (call.members.length - 1 < 2) {
      console.log('called');
      try {
        for (const member of call.members) {
          await User.update({ id: member.id }, { isInCall: false /*callId: null*/ });
        }
        await Call.delete({ id: options.callId });
      } catch (e) {
        console.error(e);
      }
      console.log('deleted');
      const payload: OutgoingKillCallMessage = {
        code: KILL_CALL_CODE,
        callId: call.id,
        threadId: call.threadId
      };

      for (const member of call.members) {
        connections.getSocket(member.id)?.send(JSON.stringify(payload));
      }

      return {
        data: true,
        errors
      };
    }

    await User.update({ id: userId }, { isInCall: false, callId: null });

    const payload: OutgoingLeaveCallMessage = {
      code: LEAVE_CALL_CODE,
      callId: options.callId,
      userId
    };
    for (const member of call.members) {
      if (member.id === userId) continue;
      connections.getSocket(member.id)?.send(JSON.stringify(payload));
    }

    return {
      data: true,
      errors
    };
  }
}
