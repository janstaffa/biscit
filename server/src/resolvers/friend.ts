import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { Friend } from '../entities/Friend';
import { FriendRequest } from '../entities/FriendRequest';
import { Thread } from '../entities/Thread';
import { ThreadMembers } from '../entities/ThreadMembers';
import {
  FriendRemoveInput,
  FriendRequestInput,
  RequestAcceptInput,
  RequestCancelInput
} from '../entities/types/friend';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import {
  connections,
  FRIEND_REMOVE_CODE,
  OutgoingFriendRemoveMessage,
  OutgoingRequestAcceptMessage,
  OutgoingRequestCancelMessage,
  OutgoingRequestSendMessage,
  REQUEST_ACCEPT_CODE,
  REQUEST_CANCEL_CODE,
  REQUEST_SEND_CODE
} from '../sockets';
import { ContextType } from '../types';
import { getId } from '../utils/generateId';
import { GQLValidationError } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType } from './types';

@Resolver(Friend)
export class FriendResolver {
  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async FriendRequestSend(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: FriendRequestInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const errors: GQLValidationError[] = [];

    const user = await User.findOne({ where: { id: userId } });

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

    if (!options.usernameAndTag && !options.userId) {
      errors.push(
        new GQLValidationError({
          field: 'usernameAndTag',
          value: '',
          message: "You must provide the user's username and tag."
        })
      );
      return {
        data: false,
        errors
      };
    }

    const inputArr = options.usernameAndTag?.split('#') || [];
    if (
      !options.userId &&
      (inputArr.length <= 1 ||
        !/[0-9]/.test(inputArr[inputArr.length - 1]) ||
        inputArr[inputArr.length - 1].length !== 6)
    ) {
      errors.push(
        new GQLValidationError({
          field: 'usernameAndTag',
          value: '',
          message: 'Invalid format. Please try again.'
        })
      );
      return {
        data: false,
        errors
      };
    }
    const reciever = await User.findOne({
      where: [{ username: inputArr[0], tag: inputArr[inputArr.length - 1] }, { id: options.userId }]
    });
    if (reciever) {
      const friend = await Friend.findOne({
        where: { userId, friendId: reciever.id }
      });
      if (friend) {
        errors.push(
          new GQLValidationError({
            field: 'usernameAndTag',
            value: options.usernameAndTag || '',
            message: 'You are already friends with this user.'
          })
        );
        return {
          data: false,
          errors
        };
      }
      const request = await FriendRequest.findOne({
        where: { senderId: userId, recieverId: reciever.id }
      });

      if (request) {
        errors.push(
          new GQLValidationError({
            field: 'usernameAndTag',
            value: options.usernameAndTag || '',
            message: 'You have already send a friend request to this user.'
          })
        );
        return {
          data: false,
          errors
        };
      }

      if (!reciever.allowFriendRequests) {
        errors.push(
          new GQLValidationError({
            field: 'usernameAndTag',
            value: '',
            message: "This user doesn't accept friend requests."
          })
        );
        return {
          data: false,
          errors
        };
      }
      await FriendRequest.create({
        senderId: userId,
        recieverId: reciever.id
      }).save();

      const payload: OutgoingRequestSendMessage = {
        code: REQUEST_SEND_CODE,
        userId,
        username: user.username
      };
      connections.getSocket(reciever.id)?.send(JSON.stringify(payload));
    } else {
      errors.push(
        new GQLValidationError({
          field: 'usernameAndTag',
          value: options.usernameAndTag || '',
          message: "This user doesn't exist."
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

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async FriendRequestAccept(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: RequestAcceptInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;
    const request = await FriendRequest.findOne({
      where: { id: options.requestId, recieverId: userId },
      relations: ['sender', 'reciever']
    });
    const errors: GQLValidationError[] = [];

    if (!request) {
      errors.push(
        new GQLValidationError({
          field: 'requestId',
          value: options.requestId.toString(),
          message: "This request doesn't exist."
        })
      );
      return {
        data: false,
        errors
      };
    }

    const isFriends = await Friend.findOne({
      where: { userId, friendId: request.senderId }
    });

    if (isFriends) {
      errors.push(
        new GQLValidationError({
          field: 'requestId',
          value: options.requestId.toString(),
          message: 'You are already friends with this user.'
        })
      );
      return {
        data: false,
        errors
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
          friendId: request.senderId
        }),
        Friend.create({
          key,
          threadId: thread.id,
          userId: request.senderId,
          friendId: userId
        })
      ]);

      await ThreadMembers.save([
        ThreadMembers.create({
          threadId: thread.id,
          userId
        }),
        ThreadMembers.create({
          threadId: thread.id,
          userId: request.senderId
        })
      ]);
    }

    const senderId = request.senderId;
    const reciever = request.reciever;
    await request.remove();

    if (options.value) {
      const payload: OutgoingRequestAcceptMessage = {
        code: REQUEST_ACCEPT_CODE,
        userId,
        username: reciever.username
      };
      connections.getSocket(senderId)?.send(JSON.stringify(payload));
    } else {
      const payload: OutgoingRequestCancelMessage = {
        code: REQUEST_CANCEL_CODE
      };
      connections.getSocket(senderId)?.send(JSON.stringify(payload));
    }
    return {
      data: true,
      errors
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
      where: { key: options.friendId }
    });
    const errors: GQLValidationError[] = [];

    if (!friend) {
      errors.push(
        new GQLValidationError({
          field: 'userId',
          value: options.friendId,
          message: "This friendship doesn't exist."
        })
      );
      return {
        data: false,
        errors
      };
    }
    const thread = await Thread.findOne({
      where: { isDm: true, id: friend[0].threadId }
    });

    const otherFriend = friend.find((friend) => friend.userId !== userId);
    if (!otherFriend) {
      errors.push(
        new GQLValidationError({
          field: 'userId',
          value: options.friendId,
          message: 'Your friend was not found.'
        })
      );
      return {
        data: false,
        errors
      };
    }

    await Friend.remove(friend);
    await thread?.remove();
    const payload: OutgoingFriendRemoveMessage = {
      code: FRIEND_REMOVE_CODE
    };
    connections.getSocket(otherFriend.userId)?.send(JSON.stringify(payload));

    return {
      data: true,
      errors
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
      where: { id: options.requestId, senderId: userId }
    });
    const errors: GQLValidationError[] = [];

    if (!request) {
      errors.push(
        new GQLValidationError({
          field: 'requestId',
          value: options.requestId.toString(),
          message: "This request doesn't exist or it wasn't sent by you."
        })
      );
      return {
        data: false,
        errors
      };
    }

    await request.remove();
    const payload: OutgoingRequestCancelMessage = {
      code: REQUEST_CANCEL_CODE
    };
    connections.getSocket(request.recieverId)?.send(JSON.stringify(payload));

    return {
      data: true,
      errors
    };
  }
}
