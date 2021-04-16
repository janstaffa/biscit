import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { Friend } from '../entities/Friend';
import { FriendRequest } from '../entities/FriendRequest';
import { Thread } from '../entities/Thread';
import { ThreadMembers } from '../entities/ThreadMembers';
import {
  FriendRemoveInput,
  FriendRequestInput,
  RequestAcceptInput,
  RequestCancelInput,
} from '../entities/types/friend';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import { ContextType } from '../types';
import { getId } from '../utils/generateId';
import { GQLValidationError } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType } from './types';

@Resolver(User)
export class FriendRequestResolver {
  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async FriendRequestSend(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: FriendRequestInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const reciever = await User.findOne({
      where: { username: options.username },
    });
    const errors: GQLValidationError[] = [];
    if (reciever) {
      const friend = await Friend.findOne({
        where: { userId, friendId: reciever.id },
      });
      if (friend) {
        errors.push(
          new GQLValidationError({
            field: 'username',
            value: options.username,
            message: 'You are already friends with this user.',
          })
        );
        return {
          data: false,
          errors,
        };
      }
      const request = await FriendRequest.findOne({
        where: { senderId: userId, recieverId: reciever.id },
      });

      if (request) {
        errors.push(
          new GQLValidationError({
            field: 'username',
            value: options.username,
            message: 'You have already send a friend request to this user.',
          })
        );
        return {
          data: false,
          errors,
        };
      }
      await FriendRequest.create({
        senderId: userId,
        recieverId: reciever.id,
      }).save();
    } else {
      errors.push(
        new GQLValidationError({
          field: 'username',
          value: options.username,
          message: "This user doesn't exist.",
        })
      );
      return {
        data: false,
        errors,
      };
    }
    return {
      data: true,
      errors,
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async FriendRequestAccept(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: RequestAcceptInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;
    const request = await FriendRequest.findOne({
      where: { id: options.requestId, recieverId: userId },
    });
    const errors: GQLValidationError[] = [];

    if (!request) {
      errors.push(
        new GQLValidationError({
          field: 'requestId',
          value: options.requestId.toString(),
          message: "This request doesn't exist.",
        })
      );
      return {
        data: false,
        errors,
      };
    }

    const isFriends = await Friend.findOne({
      where: { userId, friendId: request.senderId },
    });

    if (isFriends) {
      return {
        data: false,
        errors,
      };
    }

    if (options.value) {
      const key = await getId(Friend, 'key');
      const thread = await Thread.create({ isDm: true }).save();

      await Friend.save([
        Friend.create({
          key,
          threadId: thread.id,
          userId,
          friendId: request.senderId,
        }),
        Friend.create({
          key,
          threadId: thread.id,
          userId: request.senderId,
          friendId: userId,
        }),
      ]);

      await ThreadMembers.save([
        ThreadMembers.create({
          threadId: thread.id,
          userId,
        }),
        ThreadMembers.create({
          threadId: thread.id,
          userId: request.senderId,
        }),
      ]);
    }
    await request.remove();

    return {
      data: true,
      errors,
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async FriendRemove(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: FriendRemoveInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;
    const friend = await Friend.find({
      where: { key: options.friendId },
    });
    const errors: GQLValidationError[] = [];

    if (!friend) {
      errors.push(
        new GQLValidationError({
          field: 'userId',
          value: options.friendId,
          message: "This friendship doesn't exist.",
        })
      );
      return {
        data: false,
        errors,
      };
    }
    const thread = await Thread.findOne({
      where: { isDm: true, id: friend[0].threadId },
    });

    await Friend.remove(friend);
    await thread?.remove();

    return {
      data: true,
      errors,
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async FriendRequestCancel(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: RequestCancelInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;
    const request = await FriendRequest.findOne({
      where: { id: options.requestId, senderId: userId },
    });
    const errors: GQLValidationError[] = [];

    if (!request) {
      errors.push(
        new GQLValidationError({
          field: 'requestId',
          value: options.requestId.toString(),
          message: "This request doesn't exist or it wasn't sent by you.",
        })
      );
      return {
        data: false,
        errors,
      };
    }
    await request.remove();

    return {
      data: true,
      errors,
    };
  }
}
