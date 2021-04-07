import bcrypt from 'bcrypt';
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import * as yup from 'yup';
import { COOKIE_NAME, EMAIL_REGEX, SALT_ROUNDS } from '../constants';
import { LoginInput } from '../entities/types/LoginInput';
import { RegisterInput } from '../entities/types/RegisterInput';
import { User } from '../entities/User';
import { ContextType } from '../types';
import { GQLValidationError, validateSchema } from '../utils/validateYupSchema';
interface ResponseType<T> {
  data: T | null;
  errors: GQLValidationError[] | null;
}

@ObjectType()
class UserResponse {
  @Field({ nullable: true })
  data: User;

  @Field(() => [GQLValidationError], { nullable: true })
  errors: GQLValidationError[];
}

@ObjectType()
class LoginResponse {
  @Field()
  data: boolean;

  @Field(() => [GQLValidationError], { nullable: true })
  errors: GQLValidationError[];
}

@Resolver(User)
export class UserResolver {
  @Query(() => [User])
  async getAllUsers() {
    return await User.find({});
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, res }: ContextType): Promise<User | undefined> {
    const userId = req.session.userId;
    if (!userId) return undefined;

    return await User.findOne({ where: { id: userId } });
  }

  @Mutation(() => UserResponse)
  async UserRegister(
    @Ctx() { req, res }: ContextType,
    @Arg('options')
    options: RegisterInput
  ): Promise<ResponseType<User>> {
    const RegisterSchema = yup.object().shape({
      username: yup
        .string()
        .required('username is required')
        .test(
          'username',
          "username can't contain a @",
          (value) => !value?.includes('@')
        ),
      email: yup
        .string()
        .required('email is required')
        .email('this email is invalid'),
      password: yup
        .string()
        .required('password is required')
        .matches(/[0-9]/, { message: 'password must contain a number' }),
      confirmPassword: yup
        .string()
        .test('confirmPassword', "passwords don't match", function (value) {
          return this.parent.password === value;
        }),
    });

    const errors = await validateSchema(RegisterSchema, options);
    if (errors) return { data: null, errors };

    const { username, email, password } = options;
    const check = await User.find({ where: [{ username }, { email }] });
    if (check.length > 0) {
      const errors = check.map((user) => {
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
        data: null,
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
      data: user,
      errors,
    };
  }

  @Mutation(() => LoginResponse)
  async UserLogin(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: LoginInput
  ): Promise<ResponseType<boolean>> {
    if (req.session.userId) {
      return {
        data: true,
        errors: null,
      };
    }

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
          errors: null,
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
