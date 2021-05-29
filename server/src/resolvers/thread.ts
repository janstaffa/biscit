import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { createQueryBuilder } from 'typeorm';
import { File } from '../entities/File';
import { Message } from '../entities/Message';
import { Thread } from '../entities/Thread';
import { ThreadMembers } from '../entities/ThreadMembers';
import { CreateThreadInput, ThreadInput } from '../entities/types/thread';
import { isAuth } from '../middleware/isAuth';
import { ContextType } from '../types';
import { getId } from '../utils/generateId';
import { GQLValidationError } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType, StringResponse, ThreadResponse } from './types';

@Resolver(Thread)
export class ThreadResolver {
  @Query(() => ThreadResponse)
  @UseMiddleware(isAuth)
  async thread(@Ctx() { req, res }: ContextType, @Arg('options') options: ThreadInput): Promise<ResponseType<Thread>> {
    const userId = req.session.userId;
    const thread = await Thread.findOne({
      where: { id: options.threadId },
      relations: ['members', 'members.user']
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
        relations: ['thread', 'thread.members', 'thread.members.user']
      });
      const updatedThreads = await Promise.all(
        threads.map(async (thread) => {
          const response = thread;
          if (thread.thread.isDm) {
            const otherUser = thread.thread.members.filter((member) => {
              return member.user.id !== userId;
            });

            response.thread.name = otherUser[0].user.username;
          }
          const lastMessage = await createQueryBuilder(Message, 'message')
            .leftJoinAndSelect('message.user', 'user')
            .where('message."threadId" = :threadId', {
              threadId: thread.threadId
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
      console.log(member);
      await ThreadMembers.create({ threadId: id, userId: member, isAdmin: false }).save();
    }
    return {
      data: id,
      errors: []
    };
  }
}
