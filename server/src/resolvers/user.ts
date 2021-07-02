import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware
} from 'type-graphql';
import * as yup from 'yup';
import { COOKIE_NAME, EMAIL_REGEX, fallbackTokenSecret, SALT_ROUNDS, tokenExpiration } from '../constants';
import { Friend } from '../entities/Friend';
import { FriendRequest } from '../entities/FriendRequest';
import { Message } from '../entities/Message';
import { ProfilePicture } from '../entities/ProfilePicture';
import { LoginInput, RegisterInput, UpdateSettingsInput, UpdateStatusInput } from '../entities/types/user';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import { connections, OutgoingUserProfileChange, USER_PROFILE_CHANGE_CODE } from '../sockets';
import { ContextType } from '../types';
import { GQLValidationError, validateSchema } from '../utils/validateYupSchema';
import { BooleanResponse, ResponseType } from './types';
@ObjectType()
class FriendRequestResponse {
  @Field(() => [FriendRequest])
  incoming: FriendRequest[];

  @Field(() => [FriendRequest])
  outcoming: FriendRequest[];
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => FriendRequestResponse)
  async friend_requests(@Root() user: User, @Ctx() { req }: ContextType): Promise<FriendRequestResponse | null> {
    const userId = req.session.userId;
    if (userId === user.id) {
      const friend_requests = await FriendRequest.find({
        where: [{ senderId: user.id }, { recieverId: user.id }],
        relations: ['sender', 'reciever']
      });
      const incoming = friend_requests.filter((request) => request.recieverId === userId);
      const outcoming = friend_requests.filter((request) => request.senderId === userId);
      return {
        incoming,
        outcoming
      };
    }
    return null;
  }

  @FieldResolver(() => [Friend])
  async friends(@Root() user: User, @Ctx() { req }: ContextType): Promise<Friend[] | null> {
    const userId = req.session.userId;
    if (userId === user.id) {
      const friends = await Friend.find({
        where: { userId },
        relations: ['user', 'friend']
      });

      return friends;
    }
    return null;
  }

  @FieldResolver()
  async profile_picture(@Root() user: User): Promise<ProfilePicture | undefined> {
    if (!user.profile_pictureId) return;
    return await ProfilePicture.findOne({ where: { id: user.profile_pictureId } });
  }

  @FieldResolver(() => Number)
  async total_messages(@Root() user: User, @Ctx() { req }: ContextType): Promise<number | null> {
    const userId = req.session.userId;
    if (userId === user.id) {
      const messageCount = await Message.count({
        where: { userId }
      });
      return messageCount;
    }
    return null;
  }
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, res }: ContextType): Promise<User | undefined> {
    const userId = req.session.userId;
    if (!userId) return undefined;

    return await User.findOne({
      where: { id: userId }
    });
  }

  @Query(() => String, { nullable: true })
  async token(@Ctx() { req, res }: ContextType): Promise<string | undefined> {
    const userId = req.session.userId;
    if (!userId) return;

    return jwt.sign({ userId }, process.env.TOKEN_SECRET || fallbackTokenSecret, { expiresIn: tokenExpiration });
  }

  @Mutation(() => BooleanResponse)
  async UserRegister(
    @Ctx() { req, res }: ContextType,
    @Arg('options')
    options: RegisterInput
  ): Promise<ResponseType<boolean>> {
    if (req.session.userId) {
      return {
        data: false,
        errors: []
      };
    }

    const RegisterSchema = yup.object().shape({
      username: yup
        .string()
        .required('username is required')
        .test('username', "username can't contain a @", (value) => !value?.includes('@'))
        .min(5, 'username must have at least 5 characters'),

      email: yup.string().required('email is required').email('this email is invalid'),
      password: yup
        .string()
        .required('password is required')
        .matches(/[0-9]/, { message: 'password must contain a number' })
        .min(5, 'password must have at least 5 characters'),
      confirmPassword: yup.string().test('confirmPassword', "passwords don't match", function (value) {
        return this.parent.password === value;
      })
    });

    let errors = (await validateSchema(RegisterSchema, options)) || [];
    if (errors && errors.length > 0) return { data: false, errors };

    const { username, email, password } = options;
    const check = await User.find({ where: [{ username }, { email }] });

    if (check.length > 0) {
      errors = check.map((user) => {
        if (user.email === email) {
          return new GQLValidationError({
            field: 'email',
            value: email,
            message: 'This email is already registred, try to login.'
          });
        } else {
          return new GQLValidationError({
            field: 'username',
            value: username,
            message: 'This username is taken.'
          });
        }
      });
      return {
        data: false,
        errors
      };
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      username,
      email,
      password: passwordHash
    }).save();

    req.session.userId = user.id;
    return {
      data: true,
      errors
    };
  }

  @Mutation(() => BooleanResponse)
  async UserLogin(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: LoginInput
  ): Promise<ResponseType<boolean>> {
    if (req.session.userId) {
      return {
        data: true,
        errors: []
      };
    }
    const LoginSchema = yup.object().shape({
      usernameOrEmail: yup.string().required('username or email is required'),
      password: yup.string().required('password is required')
    });

    let errors = await validateSchema(LoginSchema, options);
    if (errors) return { data: false, errors };

    const { usernameOrEmail, password } = options;

    let field = 'username';
    if (EMAIL_REGEX.test(usernameOrEmail)) field = 'email';
    const user = await User.findOne({ where: { [field]: usernameOrEmail } });

    errors = [];
    if (user) {
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        req.session.userId = user.id;
        return {
          data: true,
          errors: []
        };
      } else {
        errors.push(
          new GQLValidationError({
            field: 'password',
            value: '',
            message: 'Incorrect password'
          })
        );
      }
    } else {
      errors.push(
        new GQLValidationError({
          field: 'usernameOrEmail',
          value: usernameOrEmail,
          message: 'This account was not found.'
        })
      );
    }

    return {
      data: false,
      errors
    };
  }

  @Mutation(() => Boolean)
  async UserLogout(@Ctx() { req, res }: ContextType): Promise<boolean> {
    if (req.session.userId) {
      return new Promise((resolve) =>
        req.session.destroy((err) => {
          if (err) resolve(false);

          res.clearCookie(COOKIE_NAME);
          resolve(true);
        })
      );
    }
    return false;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async UserUpdateStatus(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: UpdateStatusInput
  ): Promise<boolean> {
    const userId = req.session.userId;

    const user = await User.findOne({
      where: { id: userId },
      relations: ['threads', 'threads.thread', 'threads.thread.members']
    });
    if (!user) return false;
    const response = await User.update(userId, { bio: options.status });
    if (!response.affected || response.affected === 0) return false;

    const threadMemberIds = user.threads
      .map((membership) => membership.thread.members.map((member) => member.userId))
      .reduce((a, b) => a.concat(b), []);

    let relatives: string[] = threadMemberIds || [];

    relatives = relatives.filter((item, idx) => {
      return relatives.indexOf(item) == idx;
    });
    relatives.splice(relatives.indexOf(user.id), 1);

    relatives.forEach((relativeId) => {
      const payload: OutgoingUserProfileChange = {
        code: USER_PROFILE_CHANGE_CODE,
        userId: user.id
      };
      connections.getSocket(relativeId)?.send(JSON.stringify(payload));
    });
    return true;
  }

  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async UserUpdateSettings(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: UpdateSettingsInput
  ): Promise<ResponseType<boolean>> {
    const userId = req.session.userId;
    const errors: GQLValidationError[] = [];

    const user = await User.findOne({
      where: { id: userId },
      relations: ['threads', 'threads.thread', 'threads.thread.members']
    });
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

    const updateUser: any = {};
    if (options.newEmail && /\S/.test(options.newEmail)) {
      const isEmail = yup.string().email('This email is invalid.');
      const errs = await validateSchema(isEmail, options.newEmail);
      if (errs) {
        errors.push(...errs);
      } else {
        const user = await User.findOne({ where: { email: options.newEmail } });
        if (user) {
          errors.push(
            new GQLValidationError({
              field: 'newEmail',
              value: options.newEmail,
              message: 'An account is already registred with this email.'
            })
          );
        }
      }
      if (errors.length > 0) {
        return {
          data: false,
          errors
        };
      }

      updateUser.email = options.newEmail;
    }
    if (options.newUsername && /\S/.test(options.newUsername)) {
      updateUser.username = options.newUsername;
    }
    if (options.soundNotifications !== null) {
      updateUser.soundNotifications = options.soundNotifications;
    }
    if (options.setAsUnread !== null) {
      updateUser.setAsUnread = options.setAsUnread;
    }
    if (options.allowFriendRequests !== null) {
      updateUser.allowFriendRequests = options.allowFriendRequests;
    }
    if (options.allowThreads !== null) {
      updateUser.allowThreads = options.allowThreads;
    }
    if (options.autoUpdate !== null) {
      updateUser.autoUpdate = options.autoUpdate;
    }
    const response = await User.update(userId, updateUser);
    if (!response.affected || response.affected === 0) {
      errors.push(
        new GQLValidationError({
          field: 'userId',
          value: userId,
          message: 'Something went wrong, please try again later.'
        })
      );
      return { data: false, errors };
    }

    const threadMemberIds = user.threads
      .map((membership) => membership.thread.members.map((member) => member.userId))
      .reduce((a, b) => a.concat(b), []);

    let relatives: string[] = threadMemberIds || [];

    relatives = relatives.filter((item, idx) => {
      return relatives.indexOf(item) == idx;
    });
    relatives.splice(relatives.indexOf(user.id), 1);

    relatives.forEach((relativeId) => {
      const payload: OutgoingUserProfileChange = {
        code: USER_PROFILE_CHANGE_CODE,
        userId: user.id
      };
      connections.getSocket(relativeId)?.send(JSON.stringify(payload));
    });
    return { data: true, errors };
  }
}
