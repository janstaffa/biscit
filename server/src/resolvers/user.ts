import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
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
    @Arg('options') options: RegisterInput
  ): Promise<User> {
    const user = User.create({
      username: options.username,
      email: options.email,
      password: options.password,
    });
    await user.save();

    req.session.userId = user.id!;
    return user;
  }

  @Mutation(() => User)
  async UserLogin(
    @Ctx() { req, res }: ContextType,
    @Arg('options') options: RegisterInput
  ): Promise<User> {
    const user = User.create({
      username: options.username,
      email: options.email,
      password: options.password,
    });
    await user.save();

    return user;
  }
}
