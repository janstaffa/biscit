import { IsEmail, MaxLength, MinLength } from 'class-validator';
import { Field, InputType } from 'type-graphql';
import { ContainsNumbers } from '../decorators/ContainsNumbers';
import { IsUnique } from '../decorators/IsUnique';
import { User } from '../User';

@InputType()
export class RegisterInput {
  @Field()
  @MaxLength(255, {
    message: 'username must be shorter than 255 characters',
  })
  @MinLength(5, {
    message: 'username must be longer than 5 characters',
  })
  @IsUnique(User)
  username: string;

  @Field()
  @IsEmail()
  @IsUnique(User)
  @MaxLength(255, { message: 'email must be shorter than 255 characters' })
  email: string;

  @Field()
  @ContainsNumbers()
  @MaxLength(255, { message: 'password must be shorter than 255 characters' })
  @MinLength(5, {
    message: 'password must be longer than 5 characters',
  })
  password: string;
}
