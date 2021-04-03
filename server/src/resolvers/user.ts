import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { EMAIL_REGEX } from '../constants';
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
    const user = await User.create({
      username,
      email,
      password,
    }).save();

    console.log('uid: ', user.id);
    console.log('cookie: ', req.session);
    req.session.userId = user.id;
    return user;
  }

  @Mutation(() => Boolean)
  async UserLogin(
    @Ctx() { req, res }: ContextType,
    @Arg('options') { usernameOrEmail, password }: LoginInput
  ): Promise<boolean> {
    let field = 'username';
    if (EMAIL_REGEX.test(usernameOrEmail)) field = 'email';

    const user = await User.findOne({ where: { [field]: usernameOrEmail } });

    if (user && user.password === password) {
      req.session.userId = user.id;
      return true;
    }

    return false;
  }
}
