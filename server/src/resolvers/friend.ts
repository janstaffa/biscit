import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { Friend } from '../entities/Friend';
import { FriendRequest } from '../entities/FriendRequest';
import { FriendAcceptInput } from '../entities/types/FriendAcceptInput';
import { FriendRequestInput } from '../entities/types/FriendRequestInput';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import { ContextType } from '../types';
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
    if (!req.session.userId) {
      return {
        data: false,
        errors: null,
      };
    }
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
      errors: errors,
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async FriendRequestAccept(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: FriendAcceptInput
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
          message: "this user doesn't want to be friends with you",
        })
      );
      return {
        data: false,
        errors,
      };
    }

    const isFriends = await Friend.findOne({
      where: { userId, withUserId: request.senderId },
    });

    if (isFriends) {
      return {
        data: false,
        errors,
      };
    }

    await Friend.save([
      Friend.create({
        userId,
        withUserId: request.senderId,
      }),
      Friend.create({
        userId: request.senderId,
        withUserId: userId,
      }),
    ]);
    await request.remove();

    return {
      data: true,
      errors: null,
    };
  }
}
