import fetch from 'node-fetch';
import { createClient } from 'redis';
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { peerIdEndpoint } from '../constants';
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
  JOIN_CALL_CODE,
  KILL_CALL_CODE,
  OutgoingCancelCallMessage,
  OutgoingCreateCallMessage,
  OutgoingJoinCallMessage,
  OutgoingKillCallMessage
} from '../sockets';
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
      if (!member.thread.call?.memberIds || member.thread.call?.memberIds.length === 0) {
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

    const callId = await getId(Call, 'id');
    const membersIds = [userId];
    await Call.create({
      id: callId,
      threadId: options.threadId,
      creatorId: userId,
      memberIds: membersIds
    }).save();

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
    // pubClient.publish(options.threadId, JSON.stringify(payload));

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
    if (member.thread.call.accepted) return { data: true, errors };
    if (!member.thread.isDm && userId !== member.thread.call.creatorId) {
      const { memberIds } = member.thread.call;
      const newMemberIds = [...memberIds];
      if (newMemberIds.includes(userId)) {
        newMemberIds.splice(newMemberIds.indexOf(userId), 1);

        await Call.update({ id: member.thread.call.id }, { memberIds: newMemberIds });
        return { data: true, errors };
      }
    }

    await Call.delete({ id: member.thread.call.id });

    const payload: OutgoingCancelCallMessage = {
      code: CANCEL_CALL_CODE,
      threadId: options.threadId
    };

    member.thread.members.forEach((member) => {
      connections.getSocket(member.userId)?.send(JSON.stringify(payload));
    });
    // pubClient.publish(options.threadId, JSON.stringify(payload));

    return {
      data: true,
      errors
    };
  }

  @Mutation(() => StringResponse)
  @UseMiddleware(isAuth)
  async JoinCall(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: JoinCallMutationInput
  ): Promise<ResponseType<string>> {
    const userId = req.session.userId;

    const call = await Call.findOne({
      where: { id: options.callId },
      relations: ['thread', 'thread.members']
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
        data: null,
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
        data: null,
        errors
      };
    }

    if (call.memberIds.includes(userId)) {
      errors.push(
        new GQLValidationError({
          field: 'callId',
          value: options.callId,
          message: 'You are already a member of this call.'
        })
      );
      return {
        data: null,
        errors
      };
    }

    let partialCall: any = { accepted: true };
    if (call.memberIds.length === 1) {
      const newMemberIds = [...call.memberIds, userId];
      partialCall = { ...partialCall, memberIds: newMemberIds };
    }
    await Call.update({ id: options.callId }, partialCall);

    const payload: OutgoingJoinCallMessage = {
      code: JOIN_CALL_CODE,
      threadId: call.threadId,
      callId: call.id
    };
    call.memberIds.forEach((memberId) => {
      connections.getSocket(memberId)?.send(JSON.stringify(payload));
    });
    // pubClient.publish(call.threadId, JSON.stringify(payload));

    const peerId = await fetch(peerIdEndpoint)
      .then((res) => res.text())
      .then((data) => data);

    return {
      data: peerId,
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
      relations: ['thread', 'thread.members']
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
    if (!isMember || !call.memberIds.includes(userId)) {
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

    if (call.memberIds.length - 1 < 2) {
      await Call.delete({ id: options.callId });
      const payload: OutgoingKillCallMessage = {
        code: KILL_CALL_CODE,
        threadId: call.threadId,
        callId: call.id
      };

      call.memberIds.forEach((memberId) => {
        connections.getSocket(memberId)?.send(JSON.stringify(payload));
      });
      // pubClient.publish(call.threadId, JSON.stringify(payload));

      return {
        data: true,
        errors
      };
    }

    const newMemberIds = [...call.memberIds, userId];
    newMemberIds.splice(newMemberIds.indexOf(userId), 1);

    await Call.update({ id: options.callId }, { memberIds: newMemberIds });

    return {
      data: true,
      errors
    };
  }
}
