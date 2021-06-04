import { createClient } from 'redis';
import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { createQueryBuilder } from 'typeorm';
import { File } from '../entities/File';
import { Message } from '../entities/Message';
import { Thread } from '../entities/Thread';
import { ThreadMembers } from '../entities/ThreadMembers';
import {
  AddMemberInput,
  ChangeAdminInput,
  CreateThreadInput,
  DeleteThreadInput,
  EditThreadInput,
  LeaveThreadInput,
  RemoveMemberInput,
  ThreadInput
} from '../entities/types/thread';
import { isAuth } from '../middleware/isAuth';
import { SocketThreadMessage, THREAD_CHANGE_CODE } from '../sockets';
import { ContextType } from '../types';
import { getId } from '../utils/generateId';
import { GQLValidationError } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType, StringResponse, ThreadResponse } from './types';

const pubClient = createClient({
  url: process.env.REDIS_URL
});

@Resolver(Thread)
export class ThreadResolver {
  @Query(() => ThreadResponse)
  @UseMiddleware(isAuth)
  async thread(@Ctx() { req, res }: ContextType, @Arg('options') options: ThreadInput): Promise<ResponseType<Thread>> {
    const userId = req.session.userId;
    const thread = await Thread.findOne({
      where: { id: options.threadId },
      relations: ['members', 'members.user', 'creator']
    });
    const errors: GQLValidationError[] = [];

    if (!thread) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "This thread doesn't exist."
        })
      );
      return {
        data: null,
        errors
      };
    }
    const membership = await ThreadMembers.findOne({
      where: { threadId: options.threadId, userId }
    });

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
        errors
      };
    }

    if (thread.isDm) {
      const otherUser = thread.members.filter((member) => {
        return member.user.id !== userId;
      });

      thread.name = otherUser[0].user.username;
    }

    const media = await File.find({ where: { threadId: options.threadId }, relations: ['user'] });
    if (media) {
      thread.media = media;
    }

    const messagesCount = await Message.count({ where: { threadId: options.threadId } });
    thread.messagesCount = messagesCount;
    return {
      data: thread,
      errors
    };
  }

  @Query(() => [ThreadMembers])
  @UseMiddleware(isAuth)
  async threads(@Ctx() { req }: ContextType): Promise<ThreadMembers[] | null> {
    const userId = req.session.userId;
    if (userId === req.session.userId) {
      const threads = await ThreadMembers.find({
        where: { userId },
        relations: ['user', 'thread', 'thread.creator', 'thread.members', 'thread.members.user']
      });
      const updatedThreads = await Promise.all(
        threads.map(async (membership) => {
          const response = membership;
          if (membership.thread.isDm) {
            const otherUser = membership.thread.members.filter((member) => {
              return member.userId !== userId;
            });
            response.thread.name = otherUser[0].user.username;
          }
          const lastMessage = await createQueryBuilder(Message, 'message')
            .leftJoinAndSelect('message.user', 'user')
            .where('message."threadId" = :threadId', {
              threadId: membership.threadId
            })
            .orderBy('message."createdAt"', 'DESC')
            .getOne();

          if (lastMessage) {
            if (lastMessage.mediaIds && lastMessage.mediaIds.length > 0) {
              const files = await createQueryBuilder(File, 'file')
                .leftJoinAndSelect('file.user', 'user')
                .where('file.id IN (:...ids)', { ids: lastMessage.mediaIds })
                .getMany();
              response.thread.lastMessage = {
                ...lastMessage,
                media: files
              } as Message;
            } else {
              response.thread.lastMessage = lastMessage;
            }
          }
          const messagesCount = await Message.count({ where: { threadId: membership.threadId } });
          response.thread.messagesCount = messagesCount;
          return response;
        })
      );
      updatedThreads.sort((a, b) => {
        if (a.thread.lastActivity < b.thread.lastActivity) return 1;
        if (a.thread.lastActivity > b.thread.lastActivity) return -1;
        else return 0;
      });
      return updatedThreads;
    }
    return null;
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async ReadMessages(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: ThreadInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const membership = await ThreadMembers.update({ threadId: options.threadId, userId }, { unread: 0 });
    const errors: GQLValidationError[] = [];

    if (!membership.affected || membership.affected !== 1) {
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

    return {
      data: true,
      errors
    };
  }

  @Mutation(() => StringResponse)
  @UseMiddleware(isAuth)
  async CreateThread(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: CreateThreadInput
  ): Promise<ResponseType<string>> {
    const userId = req.session.userId;

    const id = await getId(Thread, 'id');
    await Thread.create({
      id,
      isDm: false,
      name: options.threadName,
      creatorId: userId,
      lastActivity: new Date()
    }).save();

    let members = [userId];
    if (options.members) {
      members = [...members, ...options.members];
    }
    for (const member of members) {
      await ThreadMembers.create({ threadId: id, userId: member, isAdmin: member === userId ? true : false }).save();
    }
    return {
      data: id,
      errors: []
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async EditThread(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: EditThreadInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const thread = await Thread.findOne({
      id: options.threadId,
      creatorId: userId
    });

    const errors: GQLValidationError[] = [];

    if (!thread) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "This thread doesn't exist, or it wasn't created by you."
        })
      );
      return {
        data: false,
        errors
      };
    }

    if (!options.newName || !/\S/.test(options.newName)) {
      errors.push(
        new GQLValidationError({
          field: 'newName',
          value: options.newName,
          message: 'New thread name not provided.'
        })
      );
      return {
        data: false,
        errors
      };
    }
    const updated = await Thread.update({ id: options.threadId }, { name: options.newName });
    if (updated.affected === 1) {
      thread.name = options.newName;
      const payload: SocketThreadMessage = {
        code: THREAD_CHANGE_CODE,
        threadId: options.threadId
      };

      pubClient.publish(options.threadId, JSON.stringify(payload));

      await Thread.update(
        {
          id: options.threadId,
          creatorId: userId
        },
        { lastActivity: new Date() }
      );

      return {
        data: true,
        errors
      };
    }
    return {
      data: false,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async RemoveMember(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: RemoveMemberInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const errors: GQLValidationError[] = [];

    const thread = await Thread.findOne({
      id: options.threadId,
      creatorId: userId
    });

    if (!thread) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "This thread doesn't exist, or it wasn't created by you."
        })
      );
    }

    if (!options.userId) {
      errors.push(
        new GQLValidationError({
          field: 'userId',
          value: options.userId,
          message: 'UserID was not provided.'
        })
      );
    }

    if (options.userId === userId) {
      errors.push(
        new GQLValidationError({
          field: 'userId',
          value: options.userId,
          message: "You can't remove yourself from the thread."
        })
      );
    }

    if (errors.length === 0) {
      const updated = await ThreadMembers.delete({ threadId: options.threadId, userId: options.userId });
      if (updated.affected === 1) {
        const payload: SocketThreadMessage = {
          code: THREAD_CHANGE_CODE,
          threadId: options.threadId
        };

        pubClient.publish(options.threadId, JSON.stringify(payload));

        await Thread.update(
          {
            id: options.threadId,
            creatorId: userId
          },
          { lastActivity: new Date() }
        );

        return {
          data: true,
          errors
        };
      }
      errors.push(
        new GQLValidationError({
          field: 'userId',
          value: options.userId,
          message: "This user isn't a member of this thread.."
        })
      );
    }
    return {
      data: false,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async AddMembers(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: AddMemberInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const errors: GQLValidationError[] = [];

    const thread = await Thread.findOne({
      id: options.threadId,
      creatorId: userId
    });

    if (!thread) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "This thread doesn't exist, or it wasn't created by you."
        })
      );
    }

    if (!options.newMembers || options.newMembers.length === 0) {
      errors.push(
        new GQLValidationError({
          field: 'newMembers',
          value: options.newMembers.join(','),
          message: 'newMembers were not provided.'
        })
      );
    }

    if (errors.length === 0) {
      const alreadyMembers = await createQueryBuilder(ThreadMembers, 'member')
        .where('member.threadId = :threadId AND member.userId IN (:...ids)', {
          threadId: options.threadId,
          ids: options.newMembers
        })
        .getMany();

      for (const newMember of options.newMembers) {
        const exists = alreadyMembers.find((member) => newMember === member.userId);
        if (exists) continue;
        await ThreadMembers.create({ userId: newMember, threadId: options.threadId }).save();
      }
      const payload: SocketThreadMessage = {
        code: THREAD_CHANGE_CODE,
        threadId: options.threadId
      };

      pubClient.publish(options.threadId, JSON.stringify(payload));

      await Thread.update(
        {
          id: options.threadId,
          creatorId: userId
        },
        { lastActivity: new Date() }
      );

      return {
        data: true,
        errors
      };
    }
    return {
      data: false,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async ChangeAdmin(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: ChangeAdminInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const errors: GQLValidationError[] = [];

    const thread = await Thread.findOne({
      id: options.threadId,
      creatorId: userId
    });

    if (!thread) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "This thread doesn't exist, or it wasn't created by you."
        })
      );
    }

    if (errors.length === 0) {
      const updated = await ThreadMembers.update(
        { threadId: options.threadId, userId: options.userId },
        { isAdmin: options.value }
      );

      if (updated.affected === 1) {
        const payload: SocketThreadMessage = {
          code: THREAD_CHANGE_CODE,
          threadId: options.threadId
        };

        pubClient.publish(options.threadId, JSON.stringify(payload));

        await Thread.update(
          {
            id: options.threadId,
            creatorId: userId
          },
          { lastActivity: new Date() }
        );

        return {
          data: true,
          errors
        };
      }
    }
    return {
      data: false,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async DeleteThread(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: DeleteThreadInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const errors: GQLValidationError[] = [];

    const thread = await Thread.findOne({
      id: options.threadId,
      creatorId: userId
    });

    if (!thread) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "This thread doesn't exist, or it wasn't created by you."
        })
      );
    }

    if (errors.length === 0 && thread) {
      await thread.remove();
      const payload: SocketThreadMessage = {
        code: THREAD_CHANGE_CODE,
        threadId: options.threadId
      };

      pubClient.publish(options.threadId, JSON.stringify(payload));

      return {
        data: true,
        errors
      };
    }
    return {
      data: false,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async LeaveThread(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: LeaveThreadInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;

    const errors: GQLValidationError[] = [];

    const membership = await ThreadMembers.findOne({
      where: { threadId: options.threadId, userId },
      relations: ['thread']
    });

    if (!membership) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "You aren't a member of this thread."
        })
      );
    }

    if (membership && membership.thread?.creatorId === userId) {
      errors.push(
        new GQLValidationError({
          field: 'threadId',
          value: options.threadId,
          message: "You can't leave your own thread."
        })
      );
    }
    if (errors.length === 0 && membership) {
      await membership.remove();
      const payload: SocketThreadMessage = {
        code: THREAD_CHANGE_CODE,
        threadId: options.threadId
      };

      pubClient.publish(options.threadId, JSON.stringify(payload));

      return {
        data: true,
        errors
      };
    }
    return {
      data: false,
      errors
    };
  }
}
