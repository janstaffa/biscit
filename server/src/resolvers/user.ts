import { validate } from 'class-validator';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { RegisterInput } from '../entities/types/RegisterInput';
import ResponseType from '../entities/types/ResponseType';
import { User } from '../entities/User';
import { ContextType } from '../types';

class UserResponseType extends ResponseType(User) {}

@Resolver(User)
export class UserResolver {
  @Query(() => [User])
  async getAllUsers() {
    return await User.find({});
  }

  @Mutation(() => UserResponseType)
  async register(
    @Ctx() { req, res }: ContextType,
    @Arg('options') { username, email, password }: RegisterInput
  ): Promise<UserResponseType> {
    const user = await User.create({
      username,
      email,
      password,
    });

    const errors = await validate(user);
    if (errors.length === 0) {
      user.save();
    }

    return {
      errors,
      data: user,
    };
  }
}
