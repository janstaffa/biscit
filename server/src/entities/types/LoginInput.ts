import { MaxLength } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class LoginInput {
  @Field()
  @MaxLength(255)
  usernameOrEmail: string;

  @Field()
  @MaxLength(255)
  password: string;
}
