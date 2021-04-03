import { IsEmail, Length, MaxLength } from 'class-validator';
import { Field, InputType } from 'type-graphql';
import { IsUnique } from '../decorators/IsUnique';
import { User } from '../User';

@InputType()
export class RegisterInput {
  @Field()
  @Length(5, 255)
  @IsUnique(User)
  username: string;

  @Field()
  @IsEmail()
  @IsUnique(User)
  email: string;

  @Field()
  @MaxLength(255)
  password: string;
}
