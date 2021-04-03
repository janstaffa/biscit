import bcrypt from 'bcrypt';
import { ValidationError } from 'class-validator';
import {
  Arg,
  ArgumentValidationError,
  Ctx,
  Mutation,
  Query,
  Resolver,
} from 'type-graphql';
import { COOKIE_NAME, EMAIL_REGEX, SALT_ROUNDS } from '../constants';
import { LoginInput } from '../entities/types/LoginInput';
import { RegisterInput } from '../entities/types/RegisterInput';
import { User } from '../entities/User';
import { ContextType } from '../types';
@Resolver(User)
export class UserResolver {
  @Query(() => [User])
  async getAllUsers() {
    return await User.find({});
  }

  @Mutation(() => User)
  async UserRegister(
    @Ctx() { req, res }: ContextType,
    @Arg('options') { username, email, password }: RegisterInput
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      username,
      email,
      password: passwordHash,
    }).save();

    req.session.userId = user.id;
    return user;
  }

  @Mutation(() => Boolean)
  async UserLogin(
    @Ctx() { req, res }: ContextType,
    @Arg('options') { usernameOrEmail, password }: LoginInput
  ): Promise<boolean> {
    if (req.session.userId) return true;

    let field = 'username';
    if (EMAIL_REGEX.test(usernameOrEmail)) field = 'email';
    const user = await User.findOne({ where: { [field]: usernameOrEmail } });
    const errors = [];

    if (user) {
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        req.session.userId = user.id;
        return true;
      } else {
        errors.push({
          property: 'password',
          value: password,
          constraints: {
            invalidPassword: 'invalid password',
          },
        } as ValidationError);
      }
    } else {
      errors.push({
        property: 'usernameOrEmail',
        value: usernameOrEmail,
        constraints: {
          doesntExist: 'this account was not found',
        },
      } as ValidationError);
    }

    throw new ArgumentValidationError(errors);
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
