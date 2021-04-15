import bcrypt from 'bcrypt';
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
  UseMiddleware,
} from 'type-graphql';
import * as yup from 'yup';
import { COOKIE_NAME, EMAIL_REGEX, SALT_ROUNDS } from '../constants';
import { Friend } from '../entities/Friend';
import { FriendRequest } from '../entities/FriendRequest';
import { LoginInput, RegisterInput } from '../entities/types/user';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
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
  @UseMiddleware(isAuth)
  async friend_requests(
    @Root() user: User,
    @Ctx() { req }: ContextType
  ): Promise<FriendRequestResponse | null> {
    const userId = req.session.userId;
    if (userId === user.id) {
      const friend_requests = await FriendRequest.find({
        where: [{ senderId: user.id }, { recieverId: user.id }],
        relations: ['sender', 'reciever'],
      });
      const incoming = friend_requests.filter(
        (request) => request.recieverId === userId
      );
      const outcoming = friend_requests.filter(
        (request) => request.senderId === userId
      );
      return {
        incoming,
        outcoming,
      };
    }
    return null;
  }

  @FieldResolver(() => [Friend])
  @UseMiddleware(isAuth)
  async friends(
    @Root() user: User,
    @Ctx() { req }: ContextType
  ): Promise<Friend[] | null> {
    const userId = req.session.userId;
    if (userId === user.id) {
      const friends = await Friend.find({
        where: { userId },
        relations: ['user', 'friend'],
      });

      return friends;
    }
    return null;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, res }: ContextType): Promise<User | undefined> {
    const userId = req.session.userId;
    if (!userId) return undefined;

    return await User.findOne({
      where: { id: userId },
    });
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
        errors: [],
      };
    }

    const RegisterSchema = yup.object().shape({
      username: yup
        .string()
        .required('username is required')
        .test(
          'username',
          "username can't contain a @",
          (value) => !value?.includes('@')
        )
        .min(5, 'username must have at least 5 characters'),

      email: yup
        .string()
        .required('email is required')
        .email('this email is invalid'),
      password: yup
        .string()
        .required('password is required')
        .matches(/[0-9]/, { message: 'password must contain a number' })
        .min(5, 'password must have at least 5 characters'),
      confirmPassword: yup
        .string()
        .test('confirmPassword', "passwords don't match", function (value) {
          return this.parent.password === value;
        }),
    });

    let errors = await validateSchema(RegisterSchema, options);
    if (errors) return { data: false, errors };

    const { username, email, password } = options;
    const check = await User.find({ where: [{ username }, { email }] });

    if (check.length > 0) {
      errors = check.map((user) => {
        if (user.email === email) {
          return new GQLValidationError({
            field: 'email',
            value: email,
            message: 'this email is already registred, try to login',
          });
        } else {
          return new GQLValidationError({
            field: 'username',
            value: username,
            message: 'this username is taken',
          });
        }
      });
      return {
        data: false,
        errors,
      };
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      username,
      email,
      password: passwordHash,
    }).save();

    req.session.userId = user.id;
    return {
      data: true,
      errors,
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
        errors: [],
      };
    }
    console.log(1);
    const LoginSchema = yup.object().shape({
      usernameOrEmail: yup.string().required('username or email is required'),
      password: yup.string().required('password is required'),
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
          errors: [],
        };
      } else {
        errors.push(
          new GQLValidationError({
            field: 'password',
            value: '',
            message: 'incorrect password',
          })
        );
      }
    } else {
      errors.push(
        new GQLValidationError({
          field: 'usernameOrEmail',
          value: usernameOrEmail,
          message: 'this account was not found',
        })
      );
    }

    return {
      data: false,
      errors,
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
}
