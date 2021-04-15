import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { Friend } from '../entities/Friend';
import { FriendRequest } from '../entities/FriendRequest';
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
    const reciever = await User.findOne({
      where: { username: options.username },
    });
    const errors: GQLValidationError[] = [];
    if (reciever) {
      await FriendRequest.create({
        senderId: req.session.userId,
        recieverId: reciever.id,
      }).save();
    } else {
      errors.push(
        new GQLValidationError({
          field: 'username',
          value: options.username,
          message: "this user doesn't exist",
        })
      );
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
          message: "this request doesn't exist",
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
      await Friend.save([
        Friend.create({
          key,
          userId,
          friendId: request.senderId,
        }),
        Friend.create({
          key,
          userId: request.senderId,
          friendId: userId,
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
          message: "this friendship doesn't exist",
        })
      );
      return {
        data: false,
        errors,
      };
    }
    await Friend.remove(friend);

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
          message: "this request doesn't exist or it wasn't sent by you",
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
