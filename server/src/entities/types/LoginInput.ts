import { MaxLength } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class LoginInput {
  @Field()
  @MaxLength(255, {
    message: 'username or email must be shorter than 255 characters',
  })
  usernameOrEmail: string;

  @Field()
  @MaxLength(255, { message: 'password must be shorter than 255 characters' })
  password: string;
}
